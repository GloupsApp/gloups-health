/* oxlint-disable typescript/no-extraneous-class -- Nest modules require decorated classes at the composition root. */
import { randomUUID } from "node:crypto";

import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { API_CONFIG } from "../../config.js";
import type { ApiConfig } from "../../config.js";
import { AuthorizeSensitiveChange } from "./application/authorize-sensitive-change.js";
import {
  ACCOUNT_UNIT_OF_WORK,
  IDENTITY_SESSIONS,
} from "./application/ports.js";
import type {
  AccountUnitOfWork,
  IdentitySessions,
} from "./application/ports.js";
import { RequestAccountDeletion } from "./application/request-account-deletion.js";
import { ResolveAccount } from "./application/resolve-account.js";
import {
  APPLE_NATIVE,
  createNativeApple,
} from "./infrastructure/auth/apple-native.js";
import {
  APPLE_NOTIFICATIONS,
  createAppleNotifications,
} from "./infrastructure/auth/apple-notifications.js";
import { AUTH, createAuth } from "./infrastructure/auth/auth.js";
import { createProviderCredentials } from "./infrastructure/auth/provider-credentials.js";
import { BetterAuthSessions } from "./infrastructure/auth/session-adapter.js";
import { LocalHttpEmailTransport } from "./infrastructure/email/local-http-transport.js";
import { DrizzleAccountUnitOfWork } from "./infrastructure/persistence/account-unit-of-work.js";
import {
  createDatabase,
  DATABASE,
} from "./infrastructure/persistence/database.js";
import type { DatabaseResource } from "./infrastructure/persistence/database.js";
import { DrizzleHttpRateLimit } from "./infrastructure/persistence/rate-limit.js";
import { AccountController } from "./presentation/account.controller.js";
import { AppleNativeController } from "./presentation/apple-native.controller.js";
import { AppleNotificationsController } from "./presentation/apple-notifications.controller.js";
import { HealthController } from "./presentation/health.controller.js";
import { HTTP_RATE_LIMIT } from "./presentation/http-rate-limit.js";
import { MeController } from "./presentation/me.controller.js";
import { PasswordController } from "./presentation/password.controller.js";
import { SessionGuard } from "./presentation/session.guard.js";

@Module({})
export class IdentityAccessModule {
  static register(config: ApiConfig): DynamicModule {
    return {
      controllers: [
        PasswordController,
        AccountController,
        HealthController,
        MeController,
        AppleNativeController,
        AppleNotificationsController,
      ],
      exports: [AUTH, DATABASE],
      module: IdentityAccessModule,
      providers: [
        { provide: API_CONFIG, useValue: config },
        {
          inject: [ACCOUNT_UNIT_OF_WORK],
          provide: RequestAccountDeletion,
          useFactory: (work: AccountUnitOfWork) =>
            new RequestAccountDeletion(work, Date.now, randomUUID),
        },
        { provide: DATABASE, useFactory: () => createDatabase(config) },
        {
          inject: [DATABASE],
          provide: ACCOUNT_UNIT_OF_WORK,
          useFactory: (resource: DatabaseResource) =>
            new DrizzleAccountUnitOfWork(resource.db, config),
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
          inject: [DATABASE, AuthorizeSensitiveChange, ResolveAccount],
          provide: AUTH,
          useFactory: (
            resource: DatabaseResource,
            sensitive: AuthorizeSensitiveChange,
            resolve: ResolveAccount
          ) =>
            createAuth({
              config,
              db: resource.db,
              email: new LocalHttpEmailTransport(config),
              resolve,
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
        {
          inject: [
            AUTH,
            DATABASE,
            IDENTITY_SESSIONS,
            AuthorizeSensitiveChange,
            ResolveAccount,
          ],
          provide: APPLE_NATIVE,
          useFactory: (
            auth: ReturnType<typeof createAuth>,
            resource: DatabaseResource,
            sessions: IdentitySessions,
            sensitive: AuthorizeSensitiveChange,
            resolve: ResolveAccount
          ) =>
            createNativeApple({
              auth,
              config,
              credentials: createProviderCredentials({
                config,
                db: resource.db,
                resolve,
                sensitive,
              }),
              db: resource.db,
              resolve,
              sensitive,
              sessions,
            }),
        },
        {
          inject: [AUTH, DATABASE],
          provide: APPLE_NOTIFICATIONS,
          useFactory: (
            auth: ReturnType<typeof createAuth>,
            resource: DatabaseResource
          ) => createAppleNotifications(config, resource.db, auth),
        },
        { provide: APP_GUARD, useClass: SessionGuard },
      ],
    };
  }
}
