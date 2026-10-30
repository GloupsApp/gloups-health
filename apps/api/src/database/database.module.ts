import type { ApiConfig } from "@api/config";
import { DATABASE_READY } from "@database/database-readiness.port";
import { DrizzleReadiness } from "@database/drizzle-readiness";
import { IDENTITY_DATABASE } from "@database/public";
import * as schema from "@database/schema";
import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { DrizzleModule } from "@nestjs/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";

@Module({})
export class DatabaseModule {
  static register(config: ApiConfig): DynamicModule {
    return {
      exports: [DATABASE_READY],
      imports: [
        DrizzleModule.forRootAsync({
          name: IDENTITY_DATABASE,
          useFactory: () => ({
            autoCloseConnection: true,
            connection: {
              connect_timeout: 5,
              max: 10,
              onnotice: () => {
                // Do not log PostgreSQL notices that can include query contents.
              },
              url: config.DATABASE_URL,
            },
            drizzle,
            schema,
          }),
        }),
      ],
      module: DatabaseModule,
      providers: [
        DrizzleReadiness,
        {
          inject: [DrizzleReadiness],
          provide: DATABASE_READY,
          useFactory: (readiness: DrizzleReadiness) => () => readiness.ready(),
        },
      ],
    };
  }
}
