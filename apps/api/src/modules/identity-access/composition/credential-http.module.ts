/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { IdentityHttpLifecycle } from "../presentation/identity-http.lifecycle.js";
import { MeController } from "../presentation/me.controller.js";
import { PasswordController } from "../presentation/password.controller.js";
import { AuthenticationModule } from "./authentication.module.js";
import { IdentityApplicationModule } from "./identity-application.module.js";
import { IdentityHttpPoliciesModule } from "./identity-http-policies.module.js";

@Module({
  controllers: [MeController, PasswordController],
  imports: [
    ApiConfigurationModule,
    AuthenticationModule,
    IdentityApplicationModule,
    IdentityHttpPoliciesModule,
  ],
  providers: [IdentityHttpLifecycle],
})
export class CredentialHttpModule {}
