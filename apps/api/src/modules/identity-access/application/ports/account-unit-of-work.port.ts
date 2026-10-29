import type { AccountRepository } from "../../domain/account-repository.js";

export const ACCOUNT_UNIT_OF_WORK = Symbol("ACCOUNT_UNIT_OF_WORK");

export interface AccountWorkScope {
  accounts: AccountRepository;
}

export interface AccountUnitOfWork {
  run: <T>(work: (scope: AccountWorkScope) => Promise<T>) => Promise<T>;
}
