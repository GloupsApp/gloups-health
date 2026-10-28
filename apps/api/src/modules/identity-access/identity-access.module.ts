/* oxlint-disable typescript/no-extraneous-class -- Nest modules require decorated classes at the composition root. */
import { randomUUID } from "node:crypto";

import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import type { ApiConfig } from "../../config.js";
import { AuthorizeSensitiveChange } from "./application/authorize-sensitive-change.js";
import {
  ACCOUNT_UNIT_OF_WORK,
  IDENTITY_SESSIONS,
} from "./application/ports.js";
import type { AccountUnitOfWork } from "./application/ports.js";
import { ResolveAccount } from "./application/resolve-account.js";
import { AUTH, createAuth } from "./infrastructure/auth/auth.js";
import { BetterAuthSessions } from "./infrastructure/auth/session-adapter.js";
import { LocalHttpEmailTransport } from "./infrastructure/email/local-http-transport.js";
import { DrizzleAccountUnitOfWork } from "./infrastructure/persistence/account-unit-of-work.js";
import {
  createDatabase,
  DATABASE,
} from "./infrastructure/persistence/database.js";
import type { DatabaseResource } from "./infrastructure/persistence/database.js";
import { DrizzleHttpRateLimit } from "./infrastructure/persistence/rate-limit.js";
import { HealthController } from "./presentation/health.controller.js";
import { HTTP_RATE_LIMIT } from "./presentation/http-rate-limit.js";
import { MeController } from "./presentation/me.controller.js";
import { SessionGuard } from "./presentation/session.guard.js";

@Module({})
export class IdentityAccessModule {
  static register(config: ApiConfig): DynamicModule {
    return {
      controllers: [HealthController, MeController],
      exports: [AUTH, DATABASE],
      module: IdentityAccessModule,
      providers: [
        { provide: DATABASE, useFactory: () => createDatabase(config) },
        {
          inject: [DATABASE],
          provide: ACCOUNT_UNIT_OF_WORK,
          useFactory: (resource: DatabaseResource) =>
            new DrizzleAccountUnitOfWork(resource.db),
        },
        {
          inject: [ACCOUNT_UNIT_OF_WORK],
          provide: AuthorizeSensitiveChange,
          useFactory: (work: AccountUnitOfWork) =>
            new AuthorizeSensitiveChange(work, Date.now),
        },
        {
          inject: [ACCOUNT_UNIT_OF_WORK],
          provide: ResolveAccount,
          useFactory: (work: AccountUnitOfWork) =>
            new ResolveAccount(work, Date.now, randomUUID),
        },
        {
          inject: [DATABASE, AuthorizeSensitiveChange],
          provide: AUTH,
          useFactory: (
            resource: DatabaseResource,
            sensitive: AuthorizeSensitiveChange
          ) =>
            createAuth({
              config,
              db: resource.db,
              email: new LocalHttpEmailTransport(config),
              sensitive,
            }),
        },
        {
          inject: [AUTH, DATABASE],
          provide: IDENTITY_SESSIONS,
          useFactory: (
            auth: ReturnType<typeof createAuth>,
            resource: DatabaseResource
          ) => new BetterAuthSessions(auth, resource.db),
        },
        {
          inject: [DATABASE],
          provide: HTTP_RATE_LIMIT,
          useFactory: (resource: DatabaseResource) =>
            new DrizzleHttpRateLimit(resource.db, config.secret),
        },
        { provide: APP_GUARD, useClass: SessionGuard },
      ],
    };
  }
}
