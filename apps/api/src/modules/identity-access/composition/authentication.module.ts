/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { AuthorizeSensitiveChange } from "../application/authorize-sensitive-change.js";
import { IDENTITY_SESSIONS } from "../application/ports/identity-sessions.port.js";
import { ResolveAccount } from "../application/resolve-account.js";
import { AUTH, createAuth } from "../infrastructure/auth/auth.js";
import type { Auth } from "../infrastructure/auth/auth.js";
import { BetterAuthGateway } from "../infrastructure/auth/better-auth.gateway.js";
import { BetterAuthSessions } from "../infrastructure/auth/session-adapter.js";
import { LocalHttpEmailTransport } from "../infrastructure/email/local-http-transport.js";
import { DATABASE } from "../infrastructure/persistence/database.js";
import type { DatabaseResource } from "../infrastructure/persistence/database.js";
import { IdentityApplicationModule } from "./identity-application.module.js";

@Module({
  exports: [AUTH, IDENTITY_SESSIONS, BetterAuthGateway],
  imports: [ApiConfigurationModule, IdentityApplicationModule],
  providers: [
    {
      inject: [API_CONFIG],
      provide: LocalHttpEmailTransport,
      useFactory: (config: ApiConfig) => new LocalHttpEmailTransport(config),
    },
    {
      inject: [
        API_CONFIG,
        DATABASE,
        AuthorizeSensitiveChange,
        ResolveAccount,
        LocalHttpEmailTransport,
      ],
      provide: AUTH,
      useFactory: (
        config: ApiConfig,
        resource: DatabaseResource,
        sensitive: AuthorizeSensitiveChange,
        resolve: ResolveAccount,
        email: LocalHttpEmailTransport
      ) => createAuth({ config, db: resource.db, email, resolve, sensitive }),
    },
    {
      inject: [AUTH, DATABASE],
      provide: IDENTITY_SESSIONS,
      useFactory: (auth: Auth, resource: DatabaseResource) =>
        new BetterAuthSessions(auth, resource.db),
    },
    BetterAuthGateway,
  ],
})
export class AuthenticationModule {}
