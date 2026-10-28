import type { AccountUnitOfWork } from "../../application/ports.js";
import type { AccountRepository } from "../../domain/account-repository.js";
import { DrizzleAccountRepository } from "./account-repository.js";
import type { Database } from "./database.js";

export class DrizzleAccountUnitOfWork implements AccountUnitOfWork {
  private readonly db: Database;
  constructor(db: Database) {
    this.db = db;
  }
  run<T>(
    work: (scope: { accounts: AccountRepository }) => Promise<T>
  ): Promise<T> {
    return this.db.transaction((transaction) =>
      work({ accounts: new DrizzleAccountRepository(transaction) })
    );
  }
}
