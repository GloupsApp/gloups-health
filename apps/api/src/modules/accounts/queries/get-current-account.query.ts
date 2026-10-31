import type { VerifiedIdentity } from "@authentication/public";

/** The authenticated identity comes from the resolve-account command, never an HTTP owner selector. */
export class GetCurrentAccountQuery {
  readonly identity: VerifiedIdentity;
  constructor(identity: VerifiedIdentity) {
    this.identity = identity;
  }
}
