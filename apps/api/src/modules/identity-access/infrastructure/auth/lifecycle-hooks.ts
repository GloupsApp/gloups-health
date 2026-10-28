import { AsyncLocalStorage } from "node:async_hooks";

import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import type { AuthorizeSensitiveChange } from "../../application/authorize-sensitive-change.js";
import { AccessFailureError } from "../../application/types.js";
import { gloupsAccount } from "../persistence/account-schema.js";
import { user } from "../persistence/auth-schema.js";
import type { Database } from "../persistence/database.js";
import type { VerificationLedger } from "../persistence/verification-ledger.js";

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

export const createLifecycleHooks = ({
  db,
  config,
  ledger,
  sensitive,
}: {
  db: Database;
  config: ApiConfig;
  ledger: VerificationLedger;
  sensitive: AuthorizeSensitiveChange;
}) => ({
  before: createAuthMiddleware(async (context) => {
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
        await sensitive.execute({
          authUserId: session.user.id,
          authenticatedAtMs: session.session.createdAt.getTime(),
          email: session.user.email,
          emailVerified: session.user.emailVerified,
          name: session.user.name,
          sessionId: session.session.id,
        });
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

export const createDatabaseHooks = (db: Database) => ({
  session: {
    create: {
      before: async (session: { userId: string }) => {
        const [account] = await db
          .select({ deletionId: gloupsAccount.deletionId })
          .from(gloupsAccount)
          .where(eq(gloupsAccount.authUserId, session.userId))
          .limit(1);

        if (account?.deletionId) {
          throw new APIError("FORBIDDEN", {
            code: "ACCOUNT_DELETING",
            message: "Account deletion is pending.",
          });
        }
      },
    },
  },
});

const deliveryScope = new AsyncLocalStorage<{
  pending: (() => Promise<void>)[];
}>();

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
