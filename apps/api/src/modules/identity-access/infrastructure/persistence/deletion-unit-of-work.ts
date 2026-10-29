import type { ApiConfig } from "../../../../config.js";
import type {
  DeletionUnitOfWork,
  DeletionWorkScope,
} from "../../application/ports/deletion-unit-of-work.port.js";
import { DrizzleAccountRepository } from "./account-repository.js";
import type { Database } from "./database.js";
import { DrizzleDeletionRepository } from "./deletion-repository.js";
import { withIdentityProofLock } from "./identity-proof-lock.js";

export class DrizzleDeletionUnitOfWork implements DeletionUnitOfWork {
  private readonly db: Database;
  private readonly proofDb: Database;
  private readonly config: ApiConfig;
  constructor(db: Database, proofDb: Database, config: ApiConfig) {
    this.db = db;
    this.proofDb = proofDb;
    this.config = config;
  }
  runForActor<T>(
    authUserId: string,
    work: (scope: DeletionWorkScope) => Promise<T>
  ): Promise<T> {
    return withIdentityProofLock(this.proofDb, authUserId, () =>
      this.db.transaction((transaction) =>
        work({
          accounts: new DrizzleAccountRepository(transaction),
          deletions: new DrizzleDeletionRepository(transaction, this.config),
        })
      )
    );
  }
}
