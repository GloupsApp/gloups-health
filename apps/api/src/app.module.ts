/* oxlint-disable typescript/no-extraneous-class -- Nest modules require decorated classes at the composition root. */
import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";

import type { ApiConfig } from "./config.js";
import { IdentityAccessModule } from "./modules/identity-access/identity-access.module.js";

@Module({})
export class AppModule {
  static register(config: ApiConfig): DynamicModule {
    return {
      imports: [IdentityAccessModule.register(config)],
      module: AppModule,
    };
  }
}
