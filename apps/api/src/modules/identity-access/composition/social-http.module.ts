/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { AuthorizeSensitiveChange } from "../application/authorize-sensitive-change.js";
import { IDENTITY_SESSIONS } from "../application/ports/identity-sessions.port.js";
import type { IdentitySessions } from "../application/ports/identity-sessions.port.js";
import { ResolveAccount } from "../application/resolve-account.js";
import { AppleHttpGateway } from "../infrastructure/auth/apple-http.gateway.js";
import {
  APPLE_NATIVE,
  createNativeApple,
} from "../infrastructure/auth/apple-native.js";
import {
  APPLE_NOTIFICATIONS,
  createAppleNotifications,
} from "../infrastructure/auth/apple-notifications.js";
import { AUTH } from "../infrastructure/auth/auth.js";
import type { Auth } from "../infrastructure/auth/auth.js";
import { createProviderCredentials } from "../infrastructure/auth/provider-credentials.js";
import { DATABASE } from "../infrastructure/persistence/database.js";
import type { DatabaseResource } from "../infrastructure/persistence/database.js";
import { AppleNativeController } from "../presentation/apple-native.controller.js";
import { AppleNotificationsController } from "../presentation/apple-notifications.controller.js";
import { AuthenticationModule } from "./authentication.module.js";
import { IdentityApplicationModule } from "./identity-application.module.js";
import { IdentityHttpPoliciesModule } from "./identity-http-policies.module.js";
import { IdentityPersistenceModule } from "./identity-persistence.module.js";

@Module({
  controllers: [AppleNativeController, AppleNotificationsController],
  imports: [
    IdentityPersistenceModule,
    ApiConfigurationModule,
    IdentityApplicationModule,
    AuthenticationModule,
    IdentityHttpPoliciesModule,
  ],
  providers: [
    {
      inject: [
        API_CONFIG,
        AUTH,
        DATABASE,
        IDENTITY_SESSIONS,
        AuthorizeSensitiveChange,
        ResolveAccount,
      ],
      provide: APPLE_NATIVE,
      useFactory: (
        config: ApiConfig,
        auth: Auth,
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
      inject: [API_CONFIG, AUTH, DATABASE],
      provide: APPLE_NOTIFICATIONS,
      useFactory: (config: ApiConfig, auth: Auth, resource: DatabaseResource) =>
        createAppleNotifications(config, resource.db, auth),
    },
    AppleHttpGateway,
  ],
})
export class SocialHttpModule {}
