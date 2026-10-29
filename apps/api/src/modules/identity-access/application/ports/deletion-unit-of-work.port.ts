import type { DeletionRepository } from "../../domain/deletion-job.js";
import type { AccountWorkScope } from "./account-unit-of-work.port.js";

export const DELETION_UNIT_OF_WORK = Symbol("DELETION_UNIT_OF_WORK");

export interface DeletionWorkScope extends AccountWorkScope {
  deletions: DeletionRepository;
}

export interface DeletionUnitOfWork {
  runForActor: <T>(
    authUserId: string,
    work: (scope: DeletionWorkScope) => Promise<T>
  ) => Promise<T>;
}
