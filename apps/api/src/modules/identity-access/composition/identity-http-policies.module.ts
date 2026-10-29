/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { TrustedOriginGuard } from "../presentation/trusted-origin.guard.js";
import { IdentityPersistenceModule } from "./identity-persistence.module.js";

@Module({
  exports: [TrustedOriginGuard],
  imports: [IdentityPersistenceModule, ApiConfigurationModule],
  providers: [TrustedOriginGuard],
})
export class IdentityHttpPoliciesModule {}
