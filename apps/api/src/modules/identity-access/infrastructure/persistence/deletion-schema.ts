import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const deletionJob = pgTable(
  "deletion_job",
  {
    accountId: uuid("account_id").notNull(),
    actorFingerprint: text("actor_fingerprint").notNull(),
    appleRevocation: text("apple_revocation", {
      enum: ["pending", "complete", "manual_required", "not_applicable"],
    }).notNull(),
    attempts: integer("attempts").notNull(),
    authUserId: text("auth_user_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    credentialRefs: jsonb("credential_refs").$type<string[]>().notNull(),
    gloups: text("gloups", { enum: ["pending", "deleted"] }).notNull(),
    id: uuid("id").primaryKey(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    leaseId: uuid("lease_id"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    requiresManual: boolean("requires_manual").notNull(),
    retryAt: timestamp("retry_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("deletion_actor_key_idx").on(
      table.actorFingerprint,
      table.idempotencyKey
    ),
    index("deletion_retry_idx").on(table.retryAt, table.leaseUntil),
  ]
);

export const identityTombstone = pgTable("identity_tombstone", {
  deletionId: uuid("deletion_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  fingerprint: text("fingerprint").primaryKey(),
});
