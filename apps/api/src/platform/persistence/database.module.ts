/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";
import { DrizzleModule } from "@nestjs/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { API_CONFIG } from "../../config.js";
import type { ApiConfig } from "../../config.js";
import { ApiConfigurationModule } from "../configuration/api-configuration.module.js";
import { DatabaseReadiness } from "./database-readiness.service.js";

const connection = (
  config: ApiConfig,
  name: "main" | "proof",
  max: number
) => ({
  db: drizzle(
    postgres(config.databaseURL, {
      connect_timeout: 10,
      connection: { application_name: `gloups-auth003-${name}` },
      idle_timeout: 20,
      max,
      onnotice: () => {
        /* Database notices can include private query context. */
      },
    })
  ),
});

@Module({
  exports: [DrizzleModule],
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ApiConfigurationModule],
      inject: [API_CONFIG],
      name: "main",
      useFactory: (config: ApiConfig) => connection(config, "main", 10),
    }),
    DrizzleModule.forRootAsync({
      imports: [ApiConfigurationModule],
      inject: [API_CONFIG],
      name: "proof",
      useFactory: (config: ApiConfig) => connection(config, "proof", 2),
    }),
  ],
  providers: [DatabaseReadiness],
})
export class DatabaseModule {}
