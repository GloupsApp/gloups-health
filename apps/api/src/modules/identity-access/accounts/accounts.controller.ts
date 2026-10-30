import { accountViewSchema } from "@gloups/contracts";
import { Controller, Get, Inject, Req, UseGuards } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import {
  AccountAdmissionGuard,
  accountIdentity,
} from "./account-admission.guard.js";
import type { AccountRequest } from "./account-admission.guard.js";
import type { CurrentAccount } from "./current-account.js";
import { GetCurrentAccountQuery } from "./queries/get-current-account.query.js";

@Controller("api/me")
@UseGuards(AccountAdmissionGuard)
export class AccountController {
  private readonly queries: QueryBus;
  constructor(@Inject(QueryBus) queries: QueryBus) {
    this.queries = queries;
  }
  @Get()
  async get(
    @Req()
    request: AccountRequest
  ) {
    const result = await this.queries.execute<
      GetCurrentAccountQuery,
      CurrentAccount
    >(new GetCurrentAccountQuery(accountIdentity(request)));

    const response = accountViewSchema.safeParse(result);

    if (!response.success) {
      throw new Error("Invalid account response");
    }

    return response.data;
  }
}
