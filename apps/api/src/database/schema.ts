import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export { rateLimit } from "@database/auth-rate-limit.schema";

export const user = pgTable("auth_user", {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  id: text().primaryKey(),
  image: text(),
  name: text().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  "auth_session",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    id: text().primaryKey(),
    ipAddress: text("ip_address"),
    token: text().notNull().unique(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_idx").on(table.userId)]
);

export const account = pgTable(
  "auth_account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    id: text().primaryKey(),
    idToken: text("id_token"),
    password: text(),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("account_user_idx").on(table.userId),
    uniqueIndex("account_provider_subject_idx").on(
      table.providerId,
      table.accountId
    ),
  ]
);

// Provider subjects, never email addresses, identify a revoked method.
export const providerRevocation = pgTable("auth_provider_revocation", {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  disabled: boolean().notNull().default(false),
  id: text().primaryKey(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verification = pgTable(
  "auth_verification",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    id: text().primaryKey(),
    identifier: text().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    value: text().notNull(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
    uniqueIndex("email_verification_token_idx")
      .on(table.identifier)
      .where(sql`${table.identifier} like 'email-verification:%'`),
  ]
);

export const gloupsAccount = pgTable("gloups_account", {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  id: uuid().primaryKey(),
  identityId: text("identity_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
});
