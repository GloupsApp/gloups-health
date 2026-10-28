import { loadEnvFile } from "node:process";

import { defineConfig } from "drizzle-kit";

import { localDatabaseURLSchema } from "./src/config.js";

if (!process.env["DATABASE_URL"]) {
  loadEnvFile(".env.local");
}

const url = process.env["DATABASE_URL"];

if (!url) {
  throw new Error("DATABASE_URL is required for Drizzle commands.");
}

const parsed = localDatabaseURLSchema.safeParse(url);

if (!parsed.success) {
  throw new Error("Drizzle commands require the isolated AUTH-003 database.");
}

const migrationURL = new URL(parsed.data);

migrationURL.searchParams.set("max", "1");

export default defineConfig({
  dbCredentials: { url: migrationURL.toString() },
  dialect: "postgresql",
  out: "./drizzle",
  schema: [
    "./src/modules/identity-access/infrastructure/persistence/*-schema.ts",
    "./src/modules/identity-access/infrastructure/persistence/verification-ledger.ts",
  ],
  strict: true,
  verbose: false,
});
