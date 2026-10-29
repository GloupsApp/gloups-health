import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type Database = PostgresJsDatabase;

export const DATABASE = Symbol("IDENTITY_DATABASES");

export interface DatabaseResource {
  db: Database;
  proofDb: Database;
}
