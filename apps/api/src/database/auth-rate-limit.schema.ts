import { sql } from "drizzle-orm";
import { bigint, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const rateLimit = pgTable("auth_rate_limit", {
  count: integer().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  id: text().primaryKey(),
  key: text().notNull().unique(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});
