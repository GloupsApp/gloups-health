/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { RequestBudgetGuard } from "../presentation/request-budget.guard.js";
import { TrustedOriginGuard } from "../presentation/trusted-origin.guard.js";
import { IdentityPersistenceModule } from "./identity-persistence.module.js";

@Module({
  exports: [TrustedOriginGuard, RequestBudgetGuard],
  imports: [IdentityPersistenceModule, ApiConfigurationModule],
  providers: [TrustedOriginGuard, RequestBudgetGuard],
})
export class IdentityHttpPoliciesModule {}
