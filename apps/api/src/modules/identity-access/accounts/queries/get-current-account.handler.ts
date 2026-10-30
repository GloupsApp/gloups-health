import type { CurrentAccount } from "@accounts/current-account";
import { GetCurrentAccountQuery } from "@accounts/queries/get-current-account.query";
import { GetCurrentAccountService } from "@accounts/queries/get-current-account.service";
import { Inject } from "@nestjs/common";
import { QueryHandler } from "@nestjs/cqrs";
import type { IQueryHandler } from "@nestjs/cqrs";

@QueryHandler(GetCurrentAccountQuery)
export class GetCurrentAccountHandler implements IQueryHandler<
  GetCurrentAccountQuery,
  CurrentAccount
> {
  private readonly currentAccount: GetCurrentAccountService;
  constructor(
    @Inject(GetCurrentAccountService) currentAccount: GetCurrentAccountService
  ) {
    this.currentAccount = currentAccount;
  }
  execute(query: GetCurrentAccountQuery) {
    return this.currentAccount.execute(query);
  }
}
