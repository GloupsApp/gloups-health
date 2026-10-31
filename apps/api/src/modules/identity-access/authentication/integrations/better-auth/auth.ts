import type { ApiConfig } from "@api/config";
import { providerNotifications } from "@authentication/integrations/better-auth/provider-notifications";
import type { ProviderKeys } from "@authentication/integrations/better-auth/provider-notifications";
import {
  securityPolicy,
  validateProviderUser,
} from "@authentication/integrations/better-auth/security-policy";
import { createSecurityStore } from "@authentication/integrations/better-auth/security-store";
import type { EmailDelivery } from "@authentication/integrations/email/http-email.delivery";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import type { Database } from "@database/public";
import { authSchema as schema } from "@database/public";
import { passwordPolicy } from "@gloups/contracts";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";

export const createAuth = (
  database: Database,
  config: ApiConfig,
  email: EmailDelivery,
  providerKeys?: ProviderKeys
) => {
  const security = createSecurityStore(database);

  const providers = [
    ...(config.APPLE_CLIENT_ID ? ["apple"] : []),
    ...(config.GOOGLE_CLIENT_ID ? ["google"] : []),
  ];

  const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

  if (config.APPLE_CLIENT_ID && config.APPLE_CLIENT_SECRET) {
    socialProviders.apple = {
      clientId: config.APPLE_CLIENT_ID,
      clientSecret: config.APPLE_CLIENT_SECRET,
      mapProfileToUser: async (profile) => {
        if (profile.email) {
          return {};
        }

        // Apple can omit email on later authorizations. Only a previously
        // linked, cryptographically verified subject may supply its email.
        return (await security.providerIdentity("apple", profile.sub)) ?? {};
      },
    };
  }

  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    };
  }

  return betterAuth({
    account: {
      accountLinking: {
        allowDifferentEmails: true,
        allowUnlinkingAll: false,
        disableImplicitLinking: true,
        enabled: true,
      },
      encryptOAuthTokens: true,
    },
    advanced: {
      cookiePrefix: "gloups",
      ipAddress: { ipAddressHeaders: ["x-gloups-client-ip"] },
      useSecureCookies: config.NODE_ENV === "production",
    },
    appName: "Gloups",
    basePath: "/api/auth",
    baseURL: config.API_URL,
    database: drizzleAdapter(database, {
      provider: "pg",
      schema,
      transaction: true,
    }),
    databaseHooks: {
      account: {
        create: {
          before: (account, ctx) => {
            // The SDK otherwise creates a credential if it disappears during reset.
            if (ctx?.path === "/reset-password") {
              throw new APIError("BAD_REQUEST", {
                code: "INVALID_TOKEN",
                message: "Invalid reset link",
              });
            }

            return Promise.resolve({ data: account });
          },
        },
      },
    },
    emailAndPassword: {
      autoSignIn: false,
      enabled: true,
      maxPasswordLength: passwordPolicy.maximumLength,
      minPasswordLength: passwordPolicy.minimumLength,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        email.deliver({ kind: "password-reset", recipient: user.email, url }),
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendOnSignIn: false,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        await security.registerVerification(token, user.id);
        await email.deliver({
          kind: "verification",
          recipient: user.email,
          url,
        });
      },
    },
    logger: { disabled: true },
    plugins: [
      expo(),
      securityPolicy(security, providers),
      providerNotifications(config, security, providerKeys),
    ],
    rateLimit: {
      customRules: {
        "/link-social": { max: 5, window: 60 },
        "/methods/password": { max: 3, window: 900 },
        "/methods/unlink": { max: 5, window: 60 },
        "/provider-notifications/*": false,
        "/request-password-reset": { max: 3, window: 900 },
        "/reset-password": { max: 5, window: 900 },
        "/send-verification-email": { max: 3, window: 900 },
        "/sign-in/email": { max: 5, window: 60 },
        "/sign-in/social": { max: 10, window: 60 },
        "/sign-up/email": { max: 3, window: 60 },
        "/verify-email": { max: 10, window: 60 },
      },
      enabled: true,
      max: 100,
      storage: "database",
      window: 60,
    },
    secret: config.AUTH_SECRET,
    session: {
      cookieCache: { enabled: false },
      expiresIn: 60 * 60 * 24 * 7,
      freshAge: 300,
      updateAge: 60 * 60 * 24,
    },
    socialProviders,
    trustedOrigins: [
      "gloups-health://",
      ...(config.APPLE_CLIENT_ID ? ["https://appleid.apple.com"] : []),
    ],
    user: { validateUserInfo: validateProviderUser(security) },
  });
};

export type Auth = ReturnType<typeof createAuth>;
