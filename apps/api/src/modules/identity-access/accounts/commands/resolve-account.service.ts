import type {
  IdentitySessions,
  VerifiedIdentity,
} from "../../authentication/public.js";
import { AccountAccessError } from "../account-access-error.js";
import type { AccountRepository } from "../account-repository.port.js";

export class ResolveAccountService {
  private readonly sessions: IdentitySessions;
  private readonly accounts: AccountRepository;
  private readonly nextId: () => string;
  constructor(
    sessions: IdentitySessions,
    accounts: AccountRepository,
    nextId: () => string
  ) {
    this.sessions = sessions;
    this.accounts = accounts;
    this.nextId = nextId;
  }
  async execute(proof: string): Promise<VerifiedIdentity> {
    const identity = await this.sessions.verify(proof);

    if (!identity) {
      throw new AccountAccessError("AUTH_REQUIRED");
    }

    if (!identity.emailVerified) {
      throw new AccountAccessError("EMAIL_UNVERIFIED");
    }

    await this.accounts.resolve(identity.id, this.nextId());

    return identity;
  }
}
