import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import type { ApiConfig } from "../../../../config.js";
import type { Database } from "../persistence/database.js";
import { schema } from "../persistence/schema.js";
import { authSchemaOptions } from "./auth-options.js";

export const AUTH = Symbol("BETTER_AUTH");

// Private engine registration only: public routes wait for proof/email policy.
export const createAuth = ({
  db,
  config,
}: {
  db: Database;
  config: ApiConfig;
}) =>
  betterAuth({
    ...authSchemaOptions,
    advanced: {
      ...authSchemaOptions.advanced,
      cookiePrefix: config.cookiePrefix,
    },
    baseURL: config.baseURL,
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    logger: { disabled: true },
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
  });

export type Auth = ReturnType<typeof createAuth>;
