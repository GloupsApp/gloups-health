import * as schema from "@database/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

export const IDENTITY_DATABASE = "iam";

export const createDatabase = (url: string) => {
  const db = drizzle({
    connection: {
      connectionString: url,
      connectionTimeoutMillis: 5000,
      max: 10,
    },
    schema,
  });

  return {
    close: () => db.$client.end(),
    db,
    ready: async () => {
      await db.execute(sql`select 1`);
    },
  };
};

export type Database = ReturnType<typeof createDatabase>["db"];
