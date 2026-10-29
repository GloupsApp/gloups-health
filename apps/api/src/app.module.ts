/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { IdentityApplicationModule } from "./modules/identity-access/composition/identity-application.module.js";
import { ApiConfigurationModule } from "./platform/configuration/api-configuration.module.js";
import { HealthModule } from "./platform/health/health.module.js";
import { DatabaseModule } from "./platform/persistence/database.module.js";

@Module({
  imports: [
    ApiConfigurationModule,
    DatabaseModule,
    HealthModule,
    IdentityApplicationModule,
  ],
})
export class AppModule {}
