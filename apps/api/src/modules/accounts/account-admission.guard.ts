import { AccountAccessError } from "@accounts/account-access-error";
import { ResolveAccountCommand } from "@accounts/commands/resolve-account.command";
import type { VerifiedIdentity } from "@authentication/public";
import { accountQuerySchema } from "@gloups/contracts";
import { Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import type { NodeRequest } from "@nestjs/platform-node";

const ADMITTED_IDENTITY = Symbol("ADMITTED_IDENTITY");

export type AccountRequest = NodeRequest & {
  [ADMITTED_IDENTITY]?: VerifiedIdentity;
};

export const accountIdentity = (request: AccountRequest): VerifiedIdentity => {
  const identity = request[ADMITTED_IDENTITY];

  if (!identity) {
    throw new AccountAccessError("AUTH_REQUIRED");
  }

  return identity;
};

@Injectable()
export class AccountAdmissionGuard implements CanActivate {
  private readonly commands: CommandBus;
  constructor(@Inject(CommandBus) commands: CommandBus) {
    this.commands = commands;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AccountRequest>();
    // Nest runs guards before parameter pipes: reject owner selectors before provisioning.
    accountQuerySchema.parse(request.query);
    request[ADMITTED_IDENTITY] = await this.commands.execute<
      ResolveAccountCommand,
      VerifiedIdentity
    >(new ResolveAccountCommand(request.headers.cookie ?? ""));

    return true;
  }
}
