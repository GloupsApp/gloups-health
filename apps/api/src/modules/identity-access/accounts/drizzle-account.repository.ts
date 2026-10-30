import type { AccountReader } from "@accounts/account-reader.port";
import type { AccountRepository } from "@accounts/account-repository.port";
import { IDENTITY_DATABASE, gloupsAccount } from "@database/public";
import type { Database } from "@database/public";
import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { eq } from "drizzle-orm";

@Injectable()
export class DrizzleAccountRepository
  implements AccountRepository, AccountReader
{
  private readonly database: Database;
  constructor(@InjectDrizzle(IDENTITY_DATABASE) database: Database) {
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
