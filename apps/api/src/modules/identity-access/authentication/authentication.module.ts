import type { ApiConfig } from "@api/config";
import { AUTHENTICATION_HTTP } from "@authentication/authentication-http.port";
import { IDENTITY_SESSIONS } from "@authentication/identity-sessions.port";
import { createAuth } from "@authentication/integrations/better-auth/auth";
import type { Auth } from "@authentication/integrations/better-auth/auth";
import { authHttp } from "@authentication/integrations/better-auth/auth-http";
import { BetterAuthSessions } from "@authentication/integrations/better-auth/sessions";
import { HttpEmailDelivery } from "@authentication/integrations/email/http-email.delivery";
import type { Database } from "@database/public";
import { IDENTITY_DATABASE } from "@database/public";
import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { getDrizzleToken } from "@nestjs/drizzle";

const AUTH_ENGINE = Symbol("AUTH_ENGINE");

// nestjs-doctor-ignore-next-line performance/no-orphan-modules -- createIdentityAccess() imports AuthenticationModule.register(config) and passes it to AccountsModule.
@Module({})
export class AuthenticationModule {
  static register(config: ApiConfig): DynamicModule {
    return {
      exports: [AUTHENTICATION_HTTP, IDENTITY_SESSIONS],
      module: AuthenticationModule,
      providers: [
        {
          inject: [getDrizzleToken(IDENTITY_DATABASE)],
          provide: AUTH_ENGINE,
          useFactory: (database: Database) =>
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
