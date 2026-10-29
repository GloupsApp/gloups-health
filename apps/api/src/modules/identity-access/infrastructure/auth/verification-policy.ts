import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import { user, verification } from "../persistence/auth-schema.js";
import type { Database } from "../persistence/database.js";
import type { VerificationLedger } from "../persistence/verification-ledger.js";

export const verificationQuerySchema = z.object({
  token: z.string().min(1).max(4096),
});

const issuingIdentitySchema = z.object({
  email: z.email(),
  gloupsUserId: z.string().min(1),
});

const verifyIssuedToken = async (token: string, secret: string) => {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });

    return issuingIdentitySchema.parse(verified.payload);
  } catch {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_TOKEN",
      message: "Invalid or expired verification link.",
    });
  }
};

const returnURLsSchema = z.object({
  callbackURL: z.string().optional(),
  errorCallbackURL: z.string().optional(),
  newUserCallbackURL: z.string().optional(),
  redirectTo: z.string().optional(),
});

export const emailVerificationQuerySchema = returnURLsSchema.extend({
  token: z.string().max(4096).optional(),
});

type EmailVerificationQuery = z.infer<typeof emailVerificationQuerySchema>;

const approvedReturn = (value: string, config: ApiConfig): boolean => {
  try {
    const url = new URL(value, config.baseURL);

    if (url.username || url.password || url.hash) {
      return false;
    }

    let route = url.pathname.replace(/^\/--/u, "");

    if (url.protocol === "gloups-health:") {
      route = url.hostname ? `/${url.hostname}${url.pathname}` : url.pathname;
    }

    return ["/auth/callback", "/reset-password"].includes(route);
  } catch {
    return false;
  }
};

export const checkReturnURLs = (
  body: z.input<typeof returnURLsSchema> | undefined,
  config: ApiConfig,
  trusted: (value: string) => boolean
): void => {
  const parsed = returnURLsSchema.safeParse(body);

  if (!parsed.success) {
    return;
  }

  for (const value of Object.values(parsed.data)) {
    if (value && (!approvedReturn(value, config) || !trusted(value))) {
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_CALLBACK_URL",
        message: "Invalid return route.",
      });
    }
  }
};

export const verifyResetIssuer = async (
  db: Database,
  ledger: VerificationLedger,
  body: z.input<typeof verificationQuerySchema>
) => {
  const input = verificationQuerySchema.safeParse(body);

  const issuer = input.success
    ? await ledger.issuerFor(input.data.token, "reset-password")
    : null;

  const [proof] = input.success
    ? await db
        .select({ authUserId: verification.value })
        .from(verification)
        .where(
          eq(verification.identifier, `reset-password:${input.data.token}`)
        )
        .limit(1)
    : [];

  if (!issuer || proof?.authUserId !== issuer) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_TOKEN",
      message: "Invalid or expired reset link.",
    });
  }
};

export const verifyEmailIssuer = async (
  db: Database,
  ledger: VerificationLedger,
  config: ApiConfig,
  queryInput: EmailVerificationQuery | null,
  trusted: (value: string) => boolean
): Promise<string | null> => {
  try {
    const query = verificationQuerySchema.safeParse(queryInput);

    if (!query.success) {
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_TOKEN",
        message: "Invalid verification link.",
      });
    }

    const { token } = query.data;
    const payload = await verifyIssuedToken(token, config.secret);

    const [issuer] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, payload.gloupsUserId))
      .limit(1);

    if (
      !issuer ||
      issuer.email.toLowerCase() !== payload.email ||
      !(await ledger.consume(token, payload.gloupsUserId))
    ) {
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_TOKEN",
        message: "Invalid or expired verification link.",
      });
    }
  } catch (error) {
    if (error instanceof APIError) {
      const query = returnURLsSchema.safeParse(queryInput);
      const callback = query.success ? query.data.callbackURL : undefined;

      if (
        error.body?.code === "INVALID_TOKEN" &&
        callback &&
        approvedReturn(callback, config) &&
        trusted(callback)
      ) {
        const destination = new URL(callback, config.baseURL);
        destination.search = "";
        destination.searchParams.set("flow", "verification");
        destination.searchParams.set("error", "INVALID_TOKEN");

        return destination.toString();
      }

      throw error;
    }

    throw new APIError("SERVICE_UNAVAILABLE", {
      code: "VERIFICATION_UNAVAILABLE",
      message: "Verification unavailable. Please retry.",
    });
  }

  return null;
};
