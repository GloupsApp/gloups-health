import { Module } from "@nestjs/common";

import type { ApiConfig } from "../../config.js";
import { createDatabase } from "../../database/public.js";
import { AccountsModule } from "./accounts/accounts.module.js";
import { AuthenticationModule } from "./authentication/authentication.module.js";

@Module({})
class IdentityAccessModule {}

export const createIdentityAccess = (config: ApiConfig) => {
  const database = createDatabase(config.DATABASE_URL);
  const authentication = AuthenticationModule.register(config, database.db);
  const accounts = AccountsModule.register(authentication, database.db);

  return {
    close: database.close,
    module: {
      exports: [],
      imports: [authentication, accounts],
      module: IdentityAccessModule,
      providers: [
        {
          provide: "IDENTITY_DATABASE_LIFECYCLE",
          useValue: { onApplicationShutdown: database.close },
        },
      ],
    },
    ready: database.ready,
  };
};
