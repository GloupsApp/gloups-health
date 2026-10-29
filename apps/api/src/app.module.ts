/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { ApiConfigurationModule } from "./platform/configuration/api-configuration.module.js";
import { HealthModule } from "./platform/health/health.module.js";
import { DatabaseModule } from "./platform/persistence/database.module.js";

@Module({ imports: [ApiConfigurationModule, DatabaseModule, HealthModule] })
export class AppModule {}
