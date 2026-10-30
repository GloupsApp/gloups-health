export interface VerifiedIdentity {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly emailVerified: boolean;
}

export interface IdentitySessions {
  verify: (proof: string) => Promise<VerifiedIdentity | null>;
}

export const IDENTITY_SESSIONS = Symbol("IDENTITY_SESSIONS");
