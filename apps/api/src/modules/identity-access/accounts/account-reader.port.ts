import type { GloupsAccount } from "@accounts/gloups-account";

export interface AccountReader {
  findByIdentity: (identityId: string) => Promise<GloupsAccount | null>;
}
