import type { GloupsAccount } from "./gloups-account.js";

export interface AccountRepository {
  findByIdentity: (authUserId: string) => Promise<GloupsAccount | null>;
  insert: (account: GloupsAccount) => Promise<void>;
  markDeleting: (accountId: string, deletionId: string) => Promise<void>;
}
