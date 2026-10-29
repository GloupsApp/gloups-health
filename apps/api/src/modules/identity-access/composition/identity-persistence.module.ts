/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";
import { getDrizzleToken } from "@nestjs/drizzle";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { DatabaseModule } from "../../../platform/persistence/database.module.js";
import { ACCOUNT_UNIT_OF_WORK } from "../application/ports/account-unit-of-work.port.js";
import { ACCESS_RATE_LIMIT } from "../application/ports/rate-limit.port.js";
import { DrizzleAccountUnitOfWork } from "../infrastructure/persistence/account-unit-of-work.js";
import { DATABASE } from "../infrastructure/persistence/database.js";
import type { Database } from "../infrastructure/persistence/database.js";
import { DrizzleHttpRateLimit } from "../infrastructure/persistence/rate-limit.js";

@Module({
  exports: [DATABASE, ACCOUNT_UNIT_OF_WORK, ACCESS_RATE_LIMIT],
  imports: [ApiConfigurationModule, DatabaseModule],
  providers: [
    {
      inject: [getDrizzleToken("main"), getDrizzleToken("proof")],
      provide: DATABASE,
      useFactory: (db: Database, proofDb: Database) => ({ db, proofDb }),
    },
    {
      inject: [getDrizzleToken("main")],
      provide: ACCOUNT_UNIT_OF_WORK,
      useFactory: (db: Database) => new DrizzleAccountUnitOfWork(db),
    },
    {
      inject: [getDrizzleToken("main"), API_CONFIG],
      provide: ACCESS_RATE_LIMIT,
      useFactory: (db: Database, config: ApiConfig) =>
        new DrizzleHttpRateLimit(db, config.secret),
    },
  ],
})
export class IdentityPersistenceModule {}
