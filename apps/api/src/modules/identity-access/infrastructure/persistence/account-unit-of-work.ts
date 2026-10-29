import type { ApiConfig } from "../../../../config.js";
import type {
  AccountUnitOfWork,
  AccountWorkScope,
} from "../../application/ports.js";
import { DrizzleAccountRepository } from "./account-repository.js";
import type { Database } from "./database.js";
import { DrizzleDeletionRepository } from "./deletion-repository.js";
import { withIdentityProofLock } from "./identity-proof-lock.js";

export class DrizzleAccountUnitOfWork implements AccountUnitOfWork {
  private readonly db: Database;
  private readonly proofDb: Database;
  private readonly config: ApiConfig;
  constructor(db: Database, proofDb: Database, config: ApiConfig) {
    this.db = db;
    this.proofDb = proofDb;
    this.config = config;
  }
  run<T>(work: (scope: AccountWorkScope) => Promise<T>): Promise<T> {
    return this.db.transaction((transaction) =>
      work({
        accounts: new DrizzleAccountRepository(transaction),
        deletions: new DrizzleDeletionRepository(transaction, this.config),
      })
    );
  }
  runForActor<T>(
    authUserId: string,
    work: (scope: AccountWorkScope) => Promise<T>
  ): Promise<T> {
    return withIdentityProofLock(this.proofDb, authUserId, () =>
      this.run(work)
    );
  }
}
