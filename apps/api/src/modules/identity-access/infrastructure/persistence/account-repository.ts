import { eq } from "drizzle-orm";

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
  async markDeleting(accountId: string, deletionId: string): Promise<void> {
    await this.db
      .update(gloupsAccount)
      .set({ deletionId })
      .where(eq(gloupsAccount.id, accountId));
  }
}
