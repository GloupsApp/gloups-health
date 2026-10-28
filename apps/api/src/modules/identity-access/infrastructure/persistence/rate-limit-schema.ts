import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const httpRateLimit = pgTable("http_rate_limit", {
  count: integer("count").notNull(),
  key: text("key").primaryKey(),
  windowEndsAt: timestamp("window_ends_at", { withTimezone: true }).notNull(),
});
