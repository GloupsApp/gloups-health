import type { GloupsAccount } from "@accounts/gloups-account";

export interface AccountRepository {
  /** Atomically returns the existing binding or creates it, including under concurrent first access. */
  resolve: (identityId: string, candidateId: string) => Promise<GloupsAccount>;
}
