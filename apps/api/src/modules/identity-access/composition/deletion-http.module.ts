/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { AccountController } from "../presentation/account.controller.js";
import { AuthenticationModule } from "./authentication.module.js";
import { DeletionApplicationModule } from "./deletion-application.module.js";
import { IdentityHttpPoliciesModule } from "./identity-http-policies.module.js";

@Module({
  controllers: [AccountController],
  imports: [
    ApiConfigurationModule,
    AuthenticationModule,
    DeletionApplicationModule,
    IdentityHttpPoliciesModule,
  ],
})
export class DeletionHttpModule {}
