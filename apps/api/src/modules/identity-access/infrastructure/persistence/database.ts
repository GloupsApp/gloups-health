import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ApiConfig } from "../../../../config.js";
import { schema } from "./schema.js";

export const DATABASE = Symbol("IDENTITY_DATABASE");

export const createDatabase = (config: ApiConfig) => {
  const connection = postgres(config.databaseURL, {
    connect_timeout: 10,
    connection: { application_name: "gloups-auth003-main" },
    idle_timeout: 20,
    max: 10,
    onnotice: () => {
      // Suppress database notices that may include query context.
    },
  });

  const db = drizzle(connection, { schema });

  const proofConnection = postgres(config.databaseURL, {
    connect_timeout: 10,
    connection: { application_name: "gloups-auth003-proof" },
    idle_timeout: 20,
    max: 2,
    onnotice: () => {
      /* Suppress database query context. */
    },
  });

  const proofDb = drizzle(proofConnection, { schema });

  const close = async () => {
    await Promise.all([
      connection.end({ timeout: 5 }),
      proofConnection.end({ timeout: 5 }),
    ]);
  };

  return { close, db, onApplicationShutdown: close, proofDb };
};

export type Database = ReturnType<typeof createDatabase>["db"];

export type DatabaseResource = ReturnType<typeof createDatabase>;
