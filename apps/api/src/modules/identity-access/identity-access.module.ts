/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";

import { AuthenticationModule } from "./composition/authentication.module.js";
import { CredentialHttpModule } from "./composition/credential-http.module.js";
import { DeletionHttpModule } from "./composition/deletion-http.module.js";
import { IdentityApplicationModule } from "./composition/identity-application.module.js";
import { SocialHttpModule } from "./composition/social-http.module.js";
import { SafeHttpErrors } from "./presentation/http-errors.js";
import { SessionGuard } from "./presentation/session.guard.js";

@Module({
  imports: [
    IdentityApplicationModule,
    AuthenticationModule,
    CredentialHttpModule,
    SocialHttpModule,
    DeletionHttpModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: SafeHttpErrors },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class IdentityAccessModule {}
