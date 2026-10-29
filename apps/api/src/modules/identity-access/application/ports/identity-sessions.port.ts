import type { VerifiedIdentity } from "../types.js";

export const IDENTITY_SESSIONS = Symbol("IDENTITY_SESSIONS");

export interface IdentitySessions {
  verify: (proof: string) => Promise<VerifiedIdentity | null>;
  revokeAll: (authUserId: string) => Promise<void>;
}
