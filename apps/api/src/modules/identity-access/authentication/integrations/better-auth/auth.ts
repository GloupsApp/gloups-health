import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

import type { ApiConfig } from "../../../../../config.js";
import type { Database } from "../../../../../database/public.js";
import { authSchema as schema } from "../../../../../database/public.js";
import type { EmailDelivery } from "../email/http-email.delivery.js";

export const createAuth = (
  database: Database,
  config: ApiConfig,
  email: EmailDelivery
) =>
  betterAuth({
    account: { accountLinking: { enabled: false } },
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
    emailAndPassword: {
      autoSignIn: false,
      enabled: true,
      maxPasswordLength: 128,
      minPasswordLength: 15,
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
      sendVerificationEmail: ({ user, url }) =>
        email.deliver({ kind: "verification", recipient: user.email, url }),
    },
    logger: { disabled: true },
    plugins: [expo()],
    rateLimit: {
      customRules: {
        "/request-password-reset": { max: 3, window: 900 },
        "/send-verification-email": { max: 3, window: 900 },
        "/sign-in/email": { max: 5, window: 60 },
        "/sign-up/email": { max: 3, window: 60 },
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
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: ["gloups-health://"],
  });

export type Auth = ReturnType<typeof createAuth>;
