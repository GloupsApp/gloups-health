import { createDatabase } from "@database/public";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const url = process.env["DATABASE_URL"];

if (!url) {
  throw new Error("DATABASE_URL is required");
}

const database = createDatabase(url);

try {
  await migrate(database.db, {
    migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
  });
} finally {
  await database.close();
}
