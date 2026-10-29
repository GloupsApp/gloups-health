import { and, eq } from "drizzle-orm";

import type { AccountRepository } from "../../domain/account-repository.js";
import { GloupsAccount } from "../../domain/gloups-account.js";
import { gloupsAccount } from "./account-schema.js";
import type { Database } from "./database.js";

export type IdentityTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export class DrizzleAccountRepository implements AccountRepository {
  private readonly db: IdentityTransaction;
  constructor(db: IdentityTransaction) {
    this.db = db;
  }
  async findByIdentity(authUserId: string): Promise<GloupsAccount | null> {
    const [row] = await this.db
      .select()
      .from(gloupsAccount)
      .where(eq(gloupsAccount.authUserId, authUserId))
      .limit(1);

    return row
      ? GloupsAccount.restore({
          authUserId: row.authUserId,
          createdAtMs: row.createdAt.getTime(),
          deletionId: row.deletionId,
          id: row.id,
        })
      : null;
  }
  async insert(account: GloupsAccount): Promise<void> {
    await this.db
      .insert(gloupsAccount)
      .values({
        authUserId: account.authUserId,
        createdAt: new Date(account.createdAtMs),
        deletionId: account.deletionId,
        id: account.id,
      })
      .onConflictDoNothing({ target: gloupsAccount.authUserId });
  }
  async save(account: GloupsAccount): Promise<void> {
    const [stored] = await this.db
      .update(gloupsAccount)
      .set({ deletionId: account.deletionId })
      .where(
        and(
          eq(gloupsAccount.id, account.id),
          eq(gloupsAccount.authUserId, account.authUserId)
        )
      )
      .returning({ id: gloupsAccount.id });

    if (!stored) {
      throw new Error("Account lifecycle persistence failed.");
    }
  }
}
