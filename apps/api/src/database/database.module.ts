import { ApiConfigModule } from "@api/api-config.module";
import { ApiConfig } from "@api/config";
import { DATABASE_READY } from "@database/database-readiness.port";
import { DrizzleReadiness } from "@database/drizzle-readiness";
import { IDENTITY_DATABASE } from "@database/public";
import * as schema from "@database/schema";
import { Module } from "@nestjs/common";
import { DrizzleModule } from "@nestjs/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";

@Module({
  exports: [DATABASE_READY],
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfig],
      name: IDENTITY_DATABASE,
      useFactory: (config: ApiConfig) => ({
        autoCloseConnection: true,
        connection: {
          connectionString: config.DATABASE_URL,
          connectionTimeoutMillis: 5000,
          max: 10,
        },
        drizzle,
        schema,
      }),
    }),
  ],
  providers: [
    {
      inject: [DrizzleReadiness],
      provide: DATABASE_READY,
      useFactory: (readiness: DrizzleReadiness) => () => readiness.ready(),
    },
    DrizzleReadiness,
  ],
})
export class DatabaseModule {}
