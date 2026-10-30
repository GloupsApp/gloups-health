// nestjs-doctor-ignore-file schema/require-timestamps -- Better Auth's counter schema uses lastRequest (epoch milliseconds) for its window; createdAt/updatedAt are not part of that protocol.
import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";

export const rateLimit = pgTable("auth_rate_limit", {
  count: integer().notNull(),
  id: text().primaryKey(),
  key: text().notNull().unique(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
