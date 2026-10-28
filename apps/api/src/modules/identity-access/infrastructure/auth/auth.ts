import { randomUUID } from "node:crypto";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import type { User } from "better-auth";
import { createEmailVerificationToken } from "better-auth/api";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import type { AuthorizeSensitiveChange } from "../../application/authorize-sensitive-change.js";
import type { EmailTransport } from "../../application/ports.js";
import { deliverAuthEmail } from "../email/email-transport.js";
import type { Database } from "../persistence/database.js";
import { schema } from "../persistence/schema.js";
import { VerificationLedger } from "../persistence/verification-ledger.js";
import { authSchemaOptions } from "./auth-options.js";
import {
  createDatabaseHooks,
  createLifecycleHooks,
  queueAuthEmail,
} from "./lifecycle-hooks.js";

export const AUTH = Symbol("BETTER_AUTH");

const emailLanguageSchema = z.object({
  preferredLanguage: z.enum(["en", "fr"]).default("en"),
});

const emailLanguage = (user: User) =>
  emailLanguageSchema.parse(user).preferredLanguage;

export const createAuth = ({
  db,
  config,
  email,
  sensitive,
}: {
  db: Database;
  config: ApiConfig;
  email: EmailTransport;
  sensitive: AuthorizeSensitiveChange;
}) => {
  const ledger = new VerificationLedger(db);

  return betterAuth({
    ...authSchemaOptions,
    advanced: {
      ...authSchemaOptions.advanced,
      cookiePrefix: config.cookiePrefix,
    },
    baseURL: config.baseURL,
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    databaseHooks: createDatabaseHooks(db),
    emailAndPassword: {
      ...authSchemaOptions.emailAndPassword,
      sendResetPassword: async ({ user, url, token }) => {
        await queueAuthEmail(async () => {
          await ledger.issue(token, user.id, "reset-password");
          await deliverAuthEmail(email, {
            kind: "reset-password",
            language: emailLanguage(user),
            recipient: user.email,
            url,
          });
        });
      },
    },
    emailVerification: {
      ...authSchemaOptions.emailVerification,
      sendVerificationEmail: async ({ user, url }) => {
        const token = await createEmailVerificationToken(
          config.secret,
          user.email,
          undefined,
          3600,
          { gloupsUserId: user.id, jti: randomUUID() }
        );

        const deliveryURL = new URL(url);
        deliveryURL.searchParams.set("token", token);
        await queueAuthEmail(async () => {
          await ledger.issue(token, user.id, "verify-email");
          await deliverAuthEmail(email, {
            kind: "verify-email",
            language: emailLanguage(user),
            recipient: user.email,
            url: deliveryURL.toString(),
          });
        });
      },
    },
    hooks: createLifecycleHooks({ config, db, ledger, sensitive }),
    logger: { disabled: true },
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
  });
};

export type Auth = ReturnType<typeof createAuth>;
