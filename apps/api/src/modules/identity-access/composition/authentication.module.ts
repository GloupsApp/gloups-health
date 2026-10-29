/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { IDENTITY_SESSIONS } from "../application/ports/identity-sessions.port.js";
import { AUTH, createAuth } from "../infrastructure/auth/auth.js";
import type { Auth } from "../infrastructure/auth/auth.js";
import { BetterAuthSessions } from "../infrastructure/auth/session-adapter.js";
import { DATABASE } from "../infrastructure/persistence/database.js";
import type { DatabaseResource } from "../infrastructure/persistence/database.js";
import { IdentityApplicationModule } from "./identity-application.module.js";

@Module({
  exports: [AUTH, IDENTITY_SESSIONS],
  imports: [ApiConfigurationModule, IdentityApplicationModule],
  providers: [
    {
      inject: [API_CONFIG, DATABASE],
      provide: AUTH,
      useFactory: (config: ApiConfig, resource: DatabaseResource) =>
        createAuth({ config, db: resource.db }),
    },
    {
      inject: [AUTH, DATABASE],
      provide: IDENTITY_SESSIONS,
      useFactory: (auth: Auth, resource: DatabaseResource) =>
        new BetterAuthSessions(auth, resource.db),
    },
  ],
})
export class AuthenticationModule {}
