import { createHash } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth-schema.js";
import type { Database } from "./database.js";

export const issuedVerification = pgTable(
  "issued_verification",
  {
    authUserId: text("auth_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    kind: text("kind", { enum: ["verify-email", "reset-password"] }).notNull(),
    tokenHash: text("token_hash").primaryKey(),
  },
  (table) => [index("issued_verification_user_idx").on(table.authUserId)]
);

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export class VerificationLedger {
  private readonly db: Database;
  constructor(db: Database) {
    this.db = db;
  }
  async issue(
    token: string,
    authUserId: string,
    kind: "verify-email" | "reset-password"
  ): Promise<void> {
    await this.db.insert(issuedVerification).values({
      authUserId,
      expiresAt: new Date(Date.now() + 3_600_000),
      kind,
      tokenHash: hashToken(token),
    });
  }
  async issuerFor(
    token: string,
    kind: "verify-email" | "reset-password"
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ authUserId: issuedVerification.authUserId })
      .from(issuedVerification)
      .where(
        and(
          eq(issuedVerification.tokenHash, hashToken(token)),
          eq(issuedVerification.kind, kind),
          gt(issuedVerification.expiresAt, new Date())
        )
      )
      .limit(1);

    return row?.authUserId ?? null;
  }
  async consume(token: string, authUserId: string): Promise<boolean> {
    const rows = await this.db
      .delete(issuedVerification)
      .where(
        and(
          eq(issuedVerification.tokenHash, hashToken(token)),
          eq(issuedVerification.authUserId, authUserId),
          eq(issuedVerification.kind, "verify-email"),
          gt(issuedVerification.expiresAt, new Date())
        )
      )
      .returning({ id: issuedVerification.authUserId });

    return rows.length === 1;
  }
}
