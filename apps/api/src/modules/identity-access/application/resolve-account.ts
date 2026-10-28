import { GloupsAccount } from "../domain/gloups-account.js";
import type { AccountUnitOfWork } from "./ports.js";
import { AccessFailureError } from "./types.js";
import type { AccountView, VerifiedIdentity } from "./types.js";

export class ResolveAccount {
  private readonly work: AccountUnitOfWork;
  private readonly nowMs: () => number;
  private readonly nextAccountId: () => string;
  constructor(
    work: AccountUnitOfWork,
    nowMs: () => number,
    nextAccountId: () => string
  ) {
    this.work = work;
    this.nowMs = nowMs;
    this.nextAccountId = nextAccountId;
  }
  async execute(identity: VerifiedIdentity): Promise<AccountView> {
    if (!identity.emailVerified) {
      throw new AccessFailureError("EMAIL_UNVERIFIED");
    }

    const account = await this.work.run(async ({ accounts }) => {
      let current = await accounts.findByIdentity(identity.authUserId);

      if (!current) {
        await accounts.insert(
          GloupsAccount.create(
            this.nextAccountId(),
            identity.authUserId,
            this.nowMs()
          )
        );
        current = await accounts.findByIdentity(identity.authUserId);
      }

      if (!current) {
        throw new Error("Account persistence failed.");
      }

      if (current.isDeleting) {
        throw new AccessFailureError("ACCOUNT_DELETING");
      }

      return current;
    });

    return {
      account: { id: account.id },
      user: {
        email: identity.email,
        emailVerified: identity.emailVerified,
        name: identity.name,
      },
    };
  }
}
