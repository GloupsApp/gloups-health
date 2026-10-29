import { randomUUID } from "node:crypto";

import {
  addOAuthServerContext,
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import type { AuthorizeSensitiveChange } from "../../application/authorize-sensitive-change.js";
import type { ResolveAccount } from "../../application/resolve-account.js";
import { AccessFailureError } from "../../application/types.js";
import type { Database } from "../persistence/database.js";
import { oauthLinkAttempt } from "../persistence/provider-credentials-schema.js";
import type { VerificationLedger } from "../persistence/verification-ledger.js";
import { nativeAppleProof } from "./apple-proof-context.js";
import { captureAuthLanguage } from "./auth-request-scope.js";
import {
  checkReturnURLs,
  emailVerificationQuerySchema,
  verifyResetIssuer,
  verifyEmailIssuer,
} from "./verification-policy.js";

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
  resolve,
}: {
  db: Database;
  config: ApiConfig;
  ledger: VerificationLedger;
  sensitive: AuthorizeSensitiveChange;
  resolve: ResolveAccount;
}) => ({
  before: createAuthMiddleware(async (context) => {
    const trusted = (value: string) =>
      context.context.isTrustedOrigin(value, { allowRelativePaths: true });

    checkReturnURLs(context.body, config, trusted);
    checkReturnURLs(context.query, config, trusted);

    await captureAuthLanguage(context.path, context.headers);

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
      const query = emailVerificationQuerySchema.safeParse(context.query);

      const redirect = await verifyEmailIssuer(
        db,
        ledger,
        config,
        query.success ? query.data : null,
        trusted
      );

      if (redirect) {
        throw context.redirect(redirect);
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
