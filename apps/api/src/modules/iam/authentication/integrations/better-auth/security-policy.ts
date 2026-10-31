import type { SecurityStore } from "@authentication/integrations/better-auth/security-store";
import { passwordSchema } from "@gloups/contracts";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import {
  addOAuthServerContext,
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  freshSessionMiddleware,
  getOAuthState,
  getSessionFromCtx,
  sessionMiddleware,
} from "better-auth/api";
import { z } from "zod";

const resetRequest = z.object({ email: z.email() });
const resetToken = z.object({ token: z.string().optional() });

const verificationQuery = z.object({
  callbackURL: z.string().optional(),
  token: z.string(),
});

export const securityPolicy = (store: SecurityStore, providers: string[]) =>
  ({
    endpoints: {
      addPassword: createAuthEndpoint(
        "/methods/password",
        {
          body: z.object({ newPassword: passwordSchema }),
          method: "POST",
          use: [freshSessionMiddleware],
        },
        async (ctx) => {
          if (!ctx.context.session.user.emailVerified) {
            throw new APIError("FORBIDDEN", {
              code: "EMAIL_NOT_VERIFIED",
              message: "Verify your email first",
            });
          }

          const password = await ctx.context.password.hash(
            ctx.body.newPassword
          );

          const code = await store.addPassword(
            ctx.context.session.user.id,
            ctx.context.session.session.id,
            password
          );

          if (code) {
            throw new APIError("BAD_REQUEST", {
              code,
              message:
                "Sign in again or use password reset to change your password",
            });
          }

          return ctx.json({ status: true });
        }
      ),
      configuredProviders: createAuthEndpoint(
        "/providers",
        { method: "GET" },
        (ctx) => ctx.json(providers)
      ),
      listMethods: createAuthEndpoint(
        "/methods",
        { method: "GET", use: [sessionMiddleware] },
        async (ctx) =>
          ctx.json(await store.methods(ctx.context.session.user.id))
      ),
      unlinkMethod: createAuthEndpoint(
        "/methods/unlink",
        {
          body: z.object({ accountId: z.string() }),
          method: "POST",
          use: [freshSessionMiddleware],
        },
        async (ctx) => {
          const code = await store.unlink(
            ctx.context.session.user.id,
            ctx.context.session.session.id,
            ctx.body.accountId
          );

          if (code) {
            throw new APIError("BAD_REQUEST", {
              code,
              message: "Keep at least one available sign-in method",
            });
          }

          return ctx.json({ status: true });
        }
      ),
    },
    hooks: {
      before: [
        {
          handler: createAuthMiddleware((ctx) => {
            if (
              z.object({ idToken: z.unknown() }).safeParse(ctx.body).data
                ?.idToken !== undefined
            ) {
              throw new APIError("BAD_REQUEST", {
                code: "BROWSER_AUTH_REQUIRED",
                message: "Start a new provider sign-in",
              });
            }

            return Promise.resolve();
          }),
          matcher: (ctx) =>
            ["/sign-in/social", "/link-social"].includes(ctx.path ?? ""),
        },
        {
          handler: createAuthMiddleware(async (ctx) => {
            const session = await getSessionFromCtx(ctx, {
              disableCookieCache: true,
            });

            if (
              !session ||
              !session.user.emailVerified ||
              Date.now() - session.session.createdAt.getTime() > 300_000
            ) {
              throw new APIError("UNAUTHORIZED", {
                code: "FRESH_SESSION_REQUIRED",
                message: "Sign in again before linking a method",
              });
            }

            await addOAuthServerContext({ linkSessionId: session.session.id });
          }),
          matcher: (ctx) => ctx.path === "/link-social",
        },
        {
          handler: createAuthMiddleware(async (ctx) => {
            const body = resetRequest.safeParse(ctx.body);

            if (!body.success) {
              return;
            }

            const user = await ctx.context.internalAdapter.findUserByEmail(
              body.data.email
            );

            if (!user || !(await store.hasPassword(user.user.id))) {
              await ctx.context.internalAdapter.findVerificationValue(
                "dummy-verification-token"
              );

              return ctx.json({
                message:
                  "If this email exists in our system, check your email for the reset link",
                status: true,
              });
            }

            return null;
          }),
          matcher: (ctx) => ctx.path === "/request-password-reset",
        },
        {
          handler: createAuthMiddleware(async (ctx) => {
            const body = resetToken.safeParse(ctx.body);

            const token = body.success
              ? (body.data.token ?? ctx.query?.["token"])
              : undefined;

            const parsed = z.string().safeParse(token);

            const verification = parsed.success
              ? await ctx.context.internalAdapter.findVerificationValue(
                  `reset-password:${parsed.data}`
                )
              : null;

            if (
              !verification ||
              !(await store.hasPassword(verification.value))
            ) {
              throw new APIError("BAD_REQUEST", {
                code: "INVALID_TOKEN",
                message: "Invalid reset link",
              });
            }
          }),
          matcher: (ctx) => ctx.path === "/reset-password",
        },
        {
          handler: createAuthMiddleware(async (ctx) => {
            const query = verificationQuery.safeParse(ctx.query);

            if (!query.success) {
              return;
            }

            if (!(await store.consumeVerification(query.data.token))) {
              if (
                query.data.callbackURL &&
                ctx.context.isTrustedOrigin(query.data.callbackURL)
              ) {
                const callback = new URL(
                  query.data.callbackURL,
                  ctx.context.baseURL
                );

                callback.searchParams.set("error", "INVALID_TOKEN");
                throw ctx.redirect(callback.toString());
              }

              throw new APIError("UNAUTHORIZED", {
                code: "INVALID_TOKEN",
                message: "Invalid or expired verification link",
              });
            }
          }),
          matcher: (ctx) => ctx.path === "/verify-email",
        },
      ],
    },
    id: "gloups-security",
  }) satisfies BetterAuthPlugin;

export const validateProviderUser =
  (
    store: SecurityStore
  ): NonNullable<NonNullable<BetterAuthOptions["user"]>["validateUserInfo"]> =>
  async ({ source }) => {
    if (source.method !== "oauth") {
      return;
    }

    const state = await getOAuthState();

    if (state?.link) {
      const sessionId = z
        .string()
        .safeParse(state.serverContext?.["linkSessionId"]);

      if (
        !sessionId.success ||
        !(await store.isLiveSession(sessionId.data, state.link.userId))
      ) {
        return {
          error: "link_session_expired",
          errorDescription: "Sign in again before linking",
        };
      }
    }

    const profile = z
      .object({ iat: z.number(), sub: z.string() })
      .safeParse(source.oauth?.profile);

    const provider = source.oauth?.providerId;

    if (!profile.success || !provider) {
      return { error: "invalid_provider_profile" };
    }

    const revoked = await store.revocation(provider, profile.data.sub);

    return revoked &&
      (revoked.disabled ||
        profile.data.iat <= Math.floor(revoked.revokedAt.getTime() / 1000))
      ? {
          error: "provider_access_revoked",
          errorDescription:
            "Recover this method with your provider or use another linked method",
        }
      : undefined;
  };
