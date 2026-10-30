import * as schema from "@database/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const IDENTITY_DATABASE = "identity-access";

export const createDatabase = (url: string) => {
  const client = postgres(url, {
    connect_timeout: 5,
    max: 10,
    onnotice: () => {
      // Do not export query contents in PostgreSQL notices.
    },
  });

  const db = drizzle(client, { schema });

  return {
    close: () => client.end({ timeout: 5 }),
    db,
    ready: async () => {
      await db.execute(sql`select 1`);
    },
  };
};

export type Database = ReturnType<typeof createDatabase>["db"];
