import { accountQuerySchema, accountViewSchema } from "@gloups/contracts";
import { Controller, Get, Inject, Query, Req } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import type { NodeRequest } from "@nestjs/platform-node";

import type { VerifiedIdentity } from "../authentication/public.js";
import { ResolveAccountCommand } from "./commands/resolve-account.command.js";
import type { CurrentAccount } from "./current-account.js";
import { GetCurrentAccountQuery } from "./queries/get-current-account.query.js";

@Controller("api/me")
export class AccountController {
  private readonly commands: CommandBus;
  private readonly queries: QueryBus;
  constructor(
    @Inject(CommandBus) commands: CommandBus,
    @Inject(QueryBus) queries: QueryBus
  ) {
    this.commands = commands;
    this.queries = queries;
  }
  @Get()
  async get(
    @Req()
    request: NodeRequest,
    @Query()
    query: Record<string, string>
  ) {
    accountQuerySchema.parse(query);

    const identity = await this.commands.execute<
      ResolveAccountCommand,
      VerifiedIdentity
    >(new ResolveAccountCommand(request.headers.cookie ?? ""));

    const result = await this.queries.execute<
      GetCurrentAccountQuery,
      CurrentAccount
    >(new GetCurrentAccountQuery(identity));

    const response = accountViewSchema.safeParse(result);

    if (!response.success) {
      throw new Error("Invalid account response");
    }

    return response.data;
  }
}
