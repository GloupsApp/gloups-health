import { randomUUID } from "node:crypto";

import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";

import type { Database } from "../../../database/public.js";
import { IDENTITY_SESSIONS } from "../authentication/public.js";
import type { IdentitySessions } from "../authentication/public.js";
import type { AccountReader } from "./account-reader.port.js";
import type { AccountRepository } from "./account-repository.port.js";
import { AccountController } from "./accounts.controller.js";
import { ResolveAccountHandler } from "./commands/resolve-account.handler.js";
import { ResolveAccountService } from "./commands/resolve-account.service.js";
import { DrizzleAccountRepository } from "./drizzle-account.repository.js";
import { GetCurrentAccountHandler } from "./queries/get-current-account.handler.js";
import { GetCurrentAccountService } from "./queries/get-current-account.service.js";

const ACCOUNT_REPOSITORY = Symbol("ACCOUNT_REPOSITORY");
const ACCOUNT_READER = Symbol("ACCOUNT_READER");

@Module({})
export class AccountsModule {
  static register(
    authentication: DynamicModule,
    database: Database
  ): DynamicModule {
    return {
      controllers: [AccountController],
      exports: [],
      imports: [authentication],
      module: AccountsModule,
      providers: [
        ResolveAccountHandler,
        GetCurrentAccountHandler,
        {
          provide: ACCOUNT_REPOSITORY,
          useFactory: () => new DrizzleAccountRepository(database),
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
