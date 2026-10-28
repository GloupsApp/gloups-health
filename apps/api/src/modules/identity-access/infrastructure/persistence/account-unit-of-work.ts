import type { ApiConfig } from "../../../../config.js";
import type { AccountUnitOfWork } from "../../application/ports.js";
import type { AccountRepository } from "../../domain/account-repository.js";
import type { DeletionRepository } from "../../domain/deletion-job.js";
import { DrizzleAccountRepository } from "./account-repository.js";
import type { Database } from "./database.js";
import { DrizzleDeletionRepository } from "./deletion-repository.js";

export class DrizzleAccountUnitOfWork implements AccountUnitOfWork {
  private readonly db: Database;
  private readonly config: ApiConfig;
  constructor(db: Database, config: ApiConfig) {
    this.db = db;
    this.config = config;
  }
  run<T>(
    work: (scope: {
      accounts: AccountRepository;
      deletions: DeletionRepository;
    }) => Promise<T>
  ): Promise<T> {
    return this.db.transaction((transaction) =>
      work({
        accounts: new DrizzleAccountRepository(transaction),
        deletions: new DrizzleDeletionRepository(transaction, this.config),
      })
    );
  }
}
