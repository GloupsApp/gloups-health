import { AsyncLocalStorage } from "node:async_hooks";
import { createHmac, randomUUID } from "node:crypto";

import {
  addOAuthServerContext,
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { eq, sql } from "drizzle-orm";
import { jwtVerify } from "jose";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import type { AuthorizeSensitiveChange } from "../../application/authorize-sensitive-change.js";
import type { ResolveAccount } from "../../application/resolve-account.js";
import { AccessFailureError } from "../../application/types.js";
import { gloupsAccount } from "../persistence/account-schema.js";
import { user, verification } from "../persistence/auth-schema.js";
import type { Database } from "../persistence/database.js";
import { oauthLinkAttempt } from "../persistence/provider-credentials-schema.js";
import { VerificationLedger } from "../persistence/verification-ledger.js";
import { nativeAppleProof } from "./apple-proof-context.js";

const verificationQuerySchema = z.object({
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

const sensitiveRoutes = new Set([
  "/link-social",
  "/unlink-account",
  "/set-password",
  "/change-password",
  "/revoke-sessions",
  "/revoke-other-sessions",
]);

const verifyResetIssuer = async (
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

export const createLifecycleHooks = ({
  db,
  config,
  ledger,
  sensitive,
  resolve,
}: {
  db: Database;
  config: ApiConfig;
  ledger: VerificationLedger;
  sensitive: AuthorizeSensitiveChange;
  resolve: ResolveAccount;
}) => ({
  before: createAuthMiddleware(async (context) => {
    if (["/sign-in/social", "/link-social"].includes(context.path)) {
      const body = z
        .object({
          idToken: z.object({ token: z.string() }).optional(),
          provider: z.string(),
        })
        .safeParse(context.body);

      if (
        body.success &&
        body.data.idToken &&
        (body.data.provider !== "apple" || !nativeAppleProof())
      ) {
        throw new APIError("FORBIDDEN", {
          code: "NATIVE_PROOF_REQUIRED",
          message: "Use the verified Apple exchange or browser flow.",
        });
      }
    }

    if (context.path === "/reset-password") {
      await verifyResetIssuer(db, ledger, context.body);
    }

    if (context.path === "/verify-email") {
      const query = verificationQuerySchema.safeParse(context.query);

      if (!query.success) {
        throw new APIError("BAD_REQUEST", {
          code: "INVALID_TOKEN",
          message: "Invalid verification link.",
        });
      }

      const { token } = query.data;
      const payload = await verifyIssuedToken(token, config.secret);

      try {
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
          throw error;
        }

        throw new APIError("SERVICE_UNAVAILABLE", {
          code: "VERIFICATION_UNAVAILABLE",
          message: "Verification unavailable. Please retry.",
        });
      }
    }

    if (sensitiveRoutes.has(context.path)) {
      const session = await getSessionFromCtx(context, {
        disableCookieCache: true,
      });

      if (!session) {
        throw new APIError("UNAUTHORIZED", {
          code: "AUTH_REQUIRED",
          message: "Authentication required.",
        });
      }

      try {
        const identity = {
          authUserId: session.user.id,
          authenticatedAtMs: session.session.createdAt.getTime(),
          email: session.user.email,
          emailVerified: session.user.emailVerified,
          name: session.user.name,
          sessionId: session.session.id,
        };

        await resolve.execute(identity);
        await sensitive.execute(identity);

        if (context.path === "/link-social" && !nativeAppleProof()) {
          const id = randomUUID();
          await db.insert(oauthLinkAttempt).values({
            authUserId: identity.authUserId,
            expiresAt: new Date(identity.authenticatedAtMs + 300_000),
            id,
            sessionId: identity.sessionId,
          });
          await addOAuthServerContext({ gloupsLinkAttemptId: id });
        }
      } catch (error) {
        if (error instanceof AccessFailureError) {
          throw new APIError("FORBIDDEN", {
            code: error.code,
            message: error.code,
          });
        }

        throw error;
      }
    }
  }),
});

export const identityFingerprint = (
  config: Pick<ApiConfig, "fingerprintSecret">,
  kind: "email" | "identity" | "subject",
  value: string
): string =>
  createHmac("sha256", config.fingerprintSecret)
    .update(`${kind}:${value}`)
    .digest("hex");

const deliveryScope = new AsyncLocalStorage<{
  pending: (() => Promise<void>)[];
  providerFingerprint?: string;
}>();

export const createDatabaseHooks = (db: Database, config: ApiConfig) => ({
  account: {
    create: {
      before: (value: {
        userId: string;
        providerId: string;
        accountId: string;
      }) =>
        Promise.resolve({
          data: {
            ...value,
            identityFingerprint: identityFingerprint(
              config,
              "identity",
              value.userId
            ),
            nativeSetupId: nativeAppleProof()?.intentId ?? null,
            subjectFingerprint: identityFingerprint(
              config,
              "subject",
              `${value.providerId}:${value.accountId}`
            ),
          },
        }),
    },
  },
  session: {
    create: {
      before: async (value: { userId: string }) => {
        const [account] = await db
          .select({ deletionId: gloupsAccount.deletionId })
          .from(gloupsAccount)
          .where(eq(gloupsAccount.authUserId, value.userId))
          .limit(1);

        if (account?.deletionId) {
          throw new APIError("FORBIDDEN", {
            code: "ACCOUNT_DELETING",
            message: "Account deletion is pending.",
          });
        }

        return {
          data: {
            ...value,
            identityFingerprint: identityFingerprint(
              config,
              "identity",
              value.userId
            ),
            nativeSetupId: nativeAppleProof()?.intentId ?? null,
          },
        };
      },
    },
  },
  user: {
    create: {
      before: (value: { email: string }) =>
        Promise.resolve({
          data: {
            ...value,
            emailFingerprint: identityFingerprint(
              config,
              "email",
              value.email.toLowerCase()
            ),
            nativeSetupId: nativeAppleProof()?.intentId ?? null,
            providerFingerprint:
              deliveryScope.getStore()?.providerFingerprint ?? null,
          },
        }),
    },
  },
});

export const setVerifiedProviderIdentity = (fingerprint: string): void => {
  const scope = deliveryScope.getStore();

  if (!scope) {
    throw new Error("Provider identity requires the server request scope.");
  }

  scope.providerFingerprint = fingerprint;
};

export const queueAuthEmail = (deliver: () => Promise<void>): Promise<void> => {
  const scope = deliveryScope.getStore();

  if (!scope) {
    throw new Error("Auth email delivery requires the server request scope.");
  }

  scope.pending.push(deliver);

  return Promise.resolve();
};

export const runAuthRequest = (
  path: string,
  handle: () => Promise<Response>
): Promise<Response> =>
  deliveryScope.run({ pending: [] }, async () => {
    const response = await handle();

    if (response.status >= 400) {
      return response;
    }

    const scope = deliveryScope.getStore();

    if (!scope) {
      throw new Error("Auth request scope is missing.");
    }

    try {
      // Signup commits its auth transaction before this ledger/email handoff.
      await Promise.all(scope.pending.map((deliver) => deliver()));
    } catch {
      process.stderr.write("Auth email delivery unavailable.\n");

      // Reset requests preserve the SDK's generic account-independent response.
      if (path !== "/api/auth/request-password-reset") {
        return Response.json(
          {
            code: "EMAIL_DELIVERY_UNAVAILABLE",
            message: "Email delivery unavailable. Please retry.",
          },
          { status: 503 }
        );
      }
    }

    return response;
  });

export const withIssuedProofLock = async (
  db: Database,
  proofDb: Database,
  request: Request,
  work: () => Promise<Response>
): Promise<Response> => {
  const url = new URL(request.url);
  let token: string | null = null;
  let kind: "verify-email" | "reset-password" = "verify-email";

  if (url.pathname === "/api/auth/verify-email") {
    token = url.searchParams.get("token");
  }

  if (url.pathname === "/api/auth/reset-password") {
    kind = "reset-password";

    try {
      const parsed = verificationQuerySchema.safeParse(
        await request.clone().json()
      );

      token = parsed.success ? parsed.data.token : null;
    } catch {
      /* SDK rejects malformed requests. */
    }
  }

  const issuer = token
    ? await new VerificationLedger(db).issuerFor(token, kind)
    : null;

  if (!issuer) {
    return work();
  }

  // A separate two-connection pool holds proof locks while the SDK uses its own transaction.
  return proofDb.transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`proof:${issuer}`}, 0))`
    );

    return work();
  });
};
