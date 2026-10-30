import { AccountAccessError } from "../account-access-error.js";
import type { AccountReader } from "../account-reader.port.js";
import type { CurrentAccount } from "../current-account.js";
import type { GetCurrentAccountQuery } from "./get-current-account.query.js";

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
