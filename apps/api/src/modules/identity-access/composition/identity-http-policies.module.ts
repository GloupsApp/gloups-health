/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { TrustedOriginGuard } from "../presentation/trusted-origin.guard.js";
import { IdentityApplicationModule } from "./identity-application.module.js";

@Module({
  exports: [TrustedOriginGuard],
  imports: [ApiConfigurationModule, IdentityApplicationModule],
  providers: [TrustedOriginGuard],
})
export class IdentityHttpPoliciesModule {}
