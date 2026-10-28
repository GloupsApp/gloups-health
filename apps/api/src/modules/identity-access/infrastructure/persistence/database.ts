import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ApiConfig } from "../../../../config.js";
import { schema } from "./schema.js";

export const DATABASE = Symbol("IDENTITY_DATABASE");

export const createDatabase = (config: ApiConfig) => {
  const connection = postgres(config.databaseURL, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 10,
    onnotice: () => {
      // Suppress database notices that may include query context.
    },
  });

  const db = drizzle(connection, { schema });

  const close = async () => {
    await connection.end({ timeout: 5 });
  };

  return { close, db, onApplicationShutdown: close };
};

export type Database = ReturnType<typeof createDatabase>["db"];

export type DatabaseResource = ReturnType<typeof createDatabase>;
