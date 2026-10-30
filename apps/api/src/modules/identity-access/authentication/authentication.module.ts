import { ApiConfigModule } from "@api/api-config.module";
import { ApiConfig } from "@api/config";
import { AUTHENTICATION_HTTP } from "@authentication/authentication-http.port";
import { AuthenticationMiddleware } from "@authentication/authentication.middleware";
import { IdentitySessions } from "@authentication/identity-sessions.port";
import { createAuth } from "@authentication/integrations/better-auth/auth";
import type { Auth } from "@authentication/integrations/better-auth/auth";
import { authHttp } from "@authentication/integrations/better-auth/auth-http";
import { BetterAuthSessions } from "@authentication/integrations/better-auth/sessions";
import { HttpEmailDelivery } from "@authentication/integrations/email/http-email.delivery";
import type { Database } from "@database/public";
import { IDENTITY_DATABASE } from "@database/public";
import { Module, RequestMethod } from "@nestjs/common";
import type { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { getDrizzleToken } from "@nestjs/drizzle";

const AUTH_ENGINE = Symbol("AUTH_ENGINE");

@Module({
  exports: [IdentitySessions],
  imports: [ApiConfigModule],
  providers: [
    {
      inject: [getDrizzleToken(IDENTITY_DATABASE), ApiConfig],
      provide: AUTH_ENGINE,
      useFactory: (database: Database, config: ApiConfig) =>
        createAuth(database, config, new HttpEmailDelivery(config)),
    },
    {
      inject: [AUTH_ENGINE],
      provide: IdentitySessions,
      useFactory: (auth: Auth) => new BetterAuthSessions(auth),
    },
    {
      inject: [AUTH_ENGINE, ApiConfig],
      provide: AUTHENTICATION_HTTP,
      useFactory: (auth: Auth, config: ApiConfig) => authHttp(auth, config),
    },
    AuthenticationMiddleware,
  ],
})
export class AuthenticationModule implements NestModule {
  // oxlint-disable-next-line class-methods-use-this -- NestModule requires an instance configure hook.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes({
      method: RequestMethod.ALL,
      path: "api/auth/{*path}",
    });
  }
}
