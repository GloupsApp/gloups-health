import type { AccountRepository } from "../domain/account-repository.js";
import type { VerifiedIdentity } from "./types.js";

export const IDENTITY_SESSIONS = Symbol("IDENTITY_SESSIONS");
export const ACCOUNT_UNIT_OF_WORK = Symbol("ACCOUNT_UNIT_OF_WORK");

export interface AccountUnitOfWork {
  run: <T>(
    work: (scope: { accounts: AccountRepository }) => Promise<T>
  ) => Promise<T>;
}

export interface IdentitySessions {
  verify: (proof: string) => Promise<VerifiedIdentity | null>;
  revokeAll: (authUserId: string) => Promise<void>;
}

export interface AuthEmail {
  readonly recipient: string;
  readonly language: "en" | "fr";
  readonly kind: "verify-email" | "reset-password";
  readonly url: string;
}

export interface EmailTransport {
  deliver: (message: AuthEmail) => Promise<{
    accepted: boolean;
    receiptId: string | null;
  }>;
}
