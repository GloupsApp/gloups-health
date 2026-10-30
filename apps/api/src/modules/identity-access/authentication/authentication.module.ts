import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";

import type { ApiConfig } from "../../../config.js";
import type { Database } from "../../../database/public.js";
import { AUTHENTICATION_HTTP } from "./authentication-http.port.js";
import { IDENTITY_SESSIONS } from "./identity-sessions.port.js";
import { authHttp } from "./integrations/better-auth/auth-http.js";
import { createAuth } from "./integrations/better-auth/auth.js";
import type { Auth } from "./integrations/better-auth/auth.js";
import { BetterAuthSessions } from "./integrations/better-auth/sessions.js";
import { HttpEmailDelivery } from "./integrations/email/http-email.delivery.js";

const AUTH_ENGINE = Symbol("AUTH_ENGINE");

// nestjs-doctor-ignore-next-line performance/no-orphan-modules -- createIdentityAccess() imports AuthenticationModule.register(config, database) and passes it to AccountsModule.
@Module({})
export class AuthenticationModule {
  static register(config: ApiConfig, database: Database): DynamicModule {
    return {
      exports: [AUTHENTICATION_HTTP, IDENTITY_SESSIONS],
      module: AuthenticationModule,
      providers: [
        {
          provide: AUTH_ENGINE,
          useFactory: () =>
            createAuth(database, config, new HttpEmailDelivery(config)),
        },
        {
          inject: [AUTH_ENGINE],
          provide: IDENTITY_SESSIONS,
          useFactory: (auth: Auth) => new BetterAuthSessions(auth),
        },
        {
          inject: [AUTH_ENGINE],
          provide: AUTHENTICATION_HTTP,
          useFactory: (auth: Auth) => authHttp(auth, config),
        },
      ],
    };
  }
}
