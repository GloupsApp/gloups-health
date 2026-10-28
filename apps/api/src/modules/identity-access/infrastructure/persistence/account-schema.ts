import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth-schema.js";

export const gloupsAccount = pgTable("gloups_account", {
  authUserId: text("auth_user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  deletionId: uuid("deletion_id"),
  id: uuid("id").primaryKey(),
});
