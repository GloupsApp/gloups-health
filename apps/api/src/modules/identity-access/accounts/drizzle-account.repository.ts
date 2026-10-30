import { eq } from "drizzle-orm";

import type { Database } from "../../../database/public.js";
import { gloupsAccount } from "../../../database/public.js";
import type { AccountReader } from "./account-reader.port.js";
import type { AccountRepository } from "./account-repository.port.js";

export class DrizzleAccountRepository
  implements AccountRepository, AccountReader
{
  private readonly database: Database;
  constructor(database: Database) {
    this.database = database;
  }
  async findByIdentity(identityId: string) {
    const [account] = await this.database
      .select()
      .from(gloupsAccount)
      .where(eq(gloupsAccount.identityId, identityId))
      .limit(1);

    return account ? { id: account.id, identityId: account.identityId } : null;
  }
  resolve(identityId: string, candidateId: string) {
    return this.database.transaction(async (transaction) => {
      await transaction
        .insert(gloupsAccount)
        .values({ id: candidateId, identityId })
        .onConflictDoNothing({ target: gloupsAccount.identityId });

      const [account] = await transaction
        .select()
        .from(gloupsAccount)
        .where(eq(gloupsAccount.identityId, identityId));

      if (!account) {
        throw new Error("Account binding unavailable");
      }

      return { id: account.id, identityId: account.identityId };
    });
  }
}
