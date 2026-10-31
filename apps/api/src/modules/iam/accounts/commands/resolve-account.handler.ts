import { ResolveAccountCommand } from "@accounts/commands/resolve-account.command";
import { ResolveAccountService } from "@accounts/commands/resolve-account.service";
import type { VerifiedIdentity } from "@authentication/public";
import { Inject } from "@nestjs/common";
import { CommandHandler } from "@nestjs/cqrs";
import type { ICommandHandler } from "@nestjs/cqrs";

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
