import { randomUUID } from "node:crypto";

import { AccountAdmissionGuard } from "@accounts/account-admission.guard";
import type { AccountReader } from "@accounts/account-reader.port";
import type { AccountRepository } from "@accounts/account-repository.port";
import { AccountController } from "@accounts/accounts.controller";
import { ResolveAccountHandler } from "@accounts/commands/resolve-account.handler";
import { ResolveAccountService } from "@accounts/commands/resolve-account.service";
import { DrizzleAccountRepository } from "@accounts/drizzle-account.repository";
import { GetCurrentAccountHandler } from "@accounts/queries/get-current-account.handler";
import { GetCurrentAccountService } from "@accounts/queries/get-current-account.service";
import { IDENTITY_SESSIONS } from "@authentication/public";
import type { IdentitySessions } from "@authentication/public";
import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";

const ACCOUNT_REPOSITORY = Symbol("ACCOUNT_REPOSITORY");
const ACCOUNT_READER = Symbol("ACCOUNT_READER");

// nestjs-doctor-ignore-next-line performance/no-orphan-modules -- createIdentityAccess() imports AccountsModule.register(authentication) as a DynamicModule.
@Module({})
export class AccountsModule {
  static register(authentication: DynamicModule): DynamicModule {
    return {
      controllers: [AccountController],
      exports: [],
      imports: [authentication],
      module: AccountsModule,
      providers: [
        AccountAdmissionGuard,
        ResolveAccountHandler,
        GetCurrentAccountHandler,
        {
          provide: ACCOUNT_REPOSITORY,
          useClass: DrizzleAccountRepository,
        },
        { provide: ACCOUNT_READER, useExisting: ACCOUNT_REPOSITORY },
        {
          inject: [ACCOUNT_READER],
          provide: GetCurrentAccountService,
          useFactory: (accounts: AccountReader) =>
            new GetCurrentAccountService(accounts),
        },
        {
          inject: [IDENTITY_SESSIONS, ACCOUNT_REPOSITORY],
          provide: ResolveAccountService,
          useFactory: (
            sessions: IdentitySessions,
            accounts: AccountRepository
          ) => new ResolveAccountService(sessions, accounts, randomUUID),
        },
      ],
    };
  }
}
