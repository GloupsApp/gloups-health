import type { GloupsAccount } from "./gloups-account.js";

export interface AccountReader {
  findByIdentity: (identityId: string) => Promise<GloupsAccount | null>;
}
