export interface VerifiedIdentity {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly emailVerified: boolean;
}

/** Framework-independent session contract, also used as the Nest provider token. */
export abstract class IdentitySessions {
  abstract verify(proof: string): Promise<VerifiedIdentity | null>;
}
