import { Inject } from "@nestjs/common";
import { QueryHandler } from "@nestjs/cqrs";
import type { IQueryHandler } from "@nestjs/cqrs";

import type { CurrentAccount } from "../current-account.js";
import { GetCurrentAccountQuery } from "./get-current-account.query.js";
import { GetCurrentAccountService } from "./get-current-account.service.js";

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
