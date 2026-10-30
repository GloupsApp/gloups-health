import type { GloupsAccount } from "./gloups-account.js";

export interface AccountRepository {
  /** Atomically returns the existing binding or creates it, including under concurrent first access. */
  resolve: (identityId: string, candidateId: string) => Promise<GloupsAccount>;
}
