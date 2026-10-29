/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";

import { API_CONFIG, readConfig } from "../../config.js";
import type { ApiConfig } from "../../config.js";

const apiConfiguration = registerAs("api", () => readConfig());

@Module({
  exports: [API_CONFIG],
  imports: [
    ConfigModule.forRoot({
      cache: true,
      ignoreEnvFile: true,
      load: [apiConfiguration],
    }),
  ],
  providers: [
    {
      inject: [ConfigService],
      provide: API_CONFIG,
      useFactory: (config: ConfigService) =>
        config.getOrThrow<ApiConfig>("api"),
    },
  ],
})
export class ApiConfigurationModule {}
