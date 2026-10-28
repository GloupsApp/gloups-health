import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth-schema.js";

export const providerCredential = pgTable(
  "provider_credential",
  {
    appleSubject: text("apple_subject").notNull(),
    authUserId: text("auth_user_id"),
    ciphertext: text("ciphertext"),
    clientId: text("client_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expectedActorId: text("expected_actor_id"),
    id: text("id").primaryKey(),
    phase: text("phase", {
      enum: ["prepared", "bound", "reconcile"],
    }).notNull(),
    retryAt: timestamp("retry_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("provider_credential_owner_idx").on(table.authUserId),
    index("provider_credential_subject_idx").on(table.appleSubject),
    index("provider_credential_retry_idx").on(table.phase, table.retryAt),
  ]
);

export const appleNotification = pgTable("apple_notification", {
  id: text("id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull(),
});

export const oauthLinkAttempt = pgTable("oauth_link_attempt", {
  authUserId: text("auth_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  id: uuid("id").primaryKey(),
  sessionId: text("session_id").notNull(),
});
