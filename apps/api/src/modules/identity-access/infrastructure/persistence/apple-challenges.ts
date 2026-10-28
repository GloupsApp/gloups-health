import { randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { Database } from "./database.js";

export const appleChallenge = pgTable("apple_challenge", {
  actorAuthUserId: text("actor_auth_user_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  id: uuid("id").primaryKey(),
  nonceHash: text("nonce_hash").notNull(),
  purpose: text("purpose", { enum: ["sign-in", "link"] }).notNull(),
});

export const createAppleChallenges = (db: Database) => ({
  consume(id: string, nonceHash: string, actorAuthUserId: string | null) {
    return db.transaction(async (transaction) => {
      const [row] = await transaction
        .select()
        .from(appleChallenge)
        .where(
          and(
            eq(appleChallenge.id, id),
            eq(appleChallenge.nonceHash, nonceHash),
            gt(appleChallenge.expiresAt, new Date())
          )
        )
        .for("update")
        .limit(1);

      if (!row || row.actorAuthUserId !== actorAuthUserId) {
        return null;
      }

      await transaction
        .delete(appleChallenge)
        .where(eq(appleChallenge.id, row.id));

      return row;
    });
  },
  async find(id: string) {
    const [row] = await db
      .select()
      .from(appleChallenge)
      .where(eq(appleChallenge.id, id))
      .limit(1);

    return row ?? null;
  },
  async issue(
    purpose: "sign-in" | "link",
    nonceHash: string,
    actorAuthUserId: string | null
  ) {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 300_000);
    await db
      .insert(appleChallenge)
      .values({ actorAuthUserId, expiresAt, id, nonceHash, purpose });

    return { challengeId: id, expiresAt: expiresAt.toISOString() };
  },
});
