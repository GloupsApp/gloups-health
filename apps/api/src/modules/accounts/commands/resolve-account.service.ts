import { AccountAccessError } from "@accounts/account-access-error";
import type { AccountRepository } from "@accounts/account-repository.port";
import type {
  IdentitySessions,
  VerifiedIdentity,
} from "@authentication/public";

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
