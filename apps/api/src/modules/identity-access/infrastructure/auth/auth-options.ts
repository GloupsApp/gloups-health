import { expo } from "@better-auth/expo";
import type { BetterAuthOptions } from "better-auth";

export const authSchemaOptions = {
  account: {
    accountLinking: {
      allowDifferentEmails: true,
      allowUnlinkingAll: false,
      disableImplicitLinking: true,
      enabled: true,
      updateUserInfoOnLink: false,
    },
    encryptOAuthTokens: true,
  },
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-gloups-client-ip"] },
    trustedProxyHeaders: false,
  },
  appName: "Gloups",
  basePath: "/api/auth",
  emailAndPassword: {
    autoSignIn: false,
    enabled: true,
    maxPasswordLength: 128,
    minPasswordLength: 15,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    autoSignInAfterVerification: false,
    expiresIn: 3600,
    sendOnSignIn: false,
    sendOnSignUp: true,
  },
  plugins: [expo()],
  rateLimit: {
    customRules: {
      "/request-password-reset": { max: 3, window: 900 },
      "/send-verification-email": { max: 3, window: 900 },
      "/sign-in/email": { max: 5, window: 60 },
      "/sign-in/social": { max: 10, window: 60 },
      "/sign-up/email": { max: 3, window: 60 },
    },
    enabled: true,
    max: 100,
    storage: "database",
    window: 60,
  },
  session: {
    cookieCache: { enabled: false },
    expiresIn: 604_800,
    freshAge: 300,
    updateAge: 86_400,
  },
  user: {
    additionalFields: {
      preferredLanguage: {
        defaultValue: "en",
        input: true,
        required: true,
        type: ["en", "fr"],
      },
    },
    changeEmail: { enabled: false },
    deleteUser: { enabled: false },
  },
} satisfies BetterAuthOptions;
