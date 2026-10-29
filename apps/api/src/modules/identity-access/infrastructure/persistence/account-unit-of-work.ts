import type {
  AccountUnitOfWork,
  AccountWorkScope,
} from "../../application/ports/account-unit-of-work.port.js";
import { DrizzleAccountRepository } from "./account-repository.js";
import type { Database } from "./database.js";

export class DrizzleAccountUnitOfWork implements AccountUnitOfWork {
  private readonly db: Database;
  constructor(db: Database) {
    this.db = db;
  }
  run<T>(work: (scope: AccountWorkScope) => Promise<T>): Promise<T> {
    return this.db.transaction((transaction) =>
      work({ accounts: new DrizzleAccountRepository(transaction) })
    );
  }
}
