import { AccountAccessError } from "@accounts/account-access-error";
import type { AccountReader } from "@accounts/account-reader.port";
import type { CurrentAccount } from "@accounts/current-account";
import type { GetCurrentAccountQuery } from "@accounts/queries/get-current-account.query";

export class GetCurrentAccountService {
  private readonly accounts: AccountReader;
  constructor(accounts: AccountReader) {
    this.accounts = accounts;
  }
  async execute({ identity }: GetCurrentAccountQuery): Promise<CurrentAccount> {
    if (!identity.emailVerified) {
      throw new AccountAccessError("EMAIL_UNVERIFIED");
    }

    const account = await this.accounts.findByIdentity(identity.id);

    if (!account) {
      throw new Error("Account binding unavailable");
    }

    return {
      account: { id: account.id },
      user: {
        email: identity.email,
        emailVerified: true,
        name: identity.name,
      },
    };
  }
}
