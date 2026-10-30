import { Inject } from "@nestjs/common";
import { CommandHandler } from "@nestjs/cqrs";
import type { ICommandHandler } from "@nestjs/cqrs";

import type { VerifiedIdentity } from "../../authentication/public.js";
import { ResolveAccountCommand } from "./resolve-account.command.js";
import { ResolveAccountService } from "./resolve-account.service.js";

@CommandHandler(ResolveAccountCommand)
export class ResolveAccountHandler implements ICommandHandler<
  ResolveAccountCommand,
  VerifiedIdentity
> {
  private readonly resolveAccount: ResolveAccountService;
  constructor(
    @Inject(ResolveAccountService) resolveAccount: ResolveAccountService
  ) {
    this.resolveAccount = resolveAccount;
  }
  execute(command: ResolveAccountCommand) {
    return this.resolveAccount.execute(command.proof);
  }
}
