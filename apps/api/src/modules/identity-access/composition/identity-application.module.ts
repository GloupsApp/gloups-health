/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { randomUUID } from "node:crypto";

import { Module } from "@nestjs/common";

import { AuthorizeSensitiveChange } from "../application/authorize-sensitive-change.js";
import { ACCOUNT_UNIT_OF_WORK } from "../application/ports/account-unit-of-work.port.js";
import type { AccountUnitOfWork } from "../application/ports/account-unit-of-work.port.js";
import { ResolveAccount } from "../application/resolve-account.js";
import { IdentityPersistenceModule } from "./identity-persistence.module.js";

@Module({
  exports: [ResolveAccount, AuthorizeSensitiveChange],
  imports: [IdentityPersistenceModule],
  providers: [
    {
      inject: [ACCOUNT_UNIT_OF_WORK],
      provide: ResolveAccount,
      useFactory: (work: AccountUnitOfWork) =>
        new ResolveAccount(work, Date.now, randomUUID),
    },
    {
      inject: [ACCOUNT_UNIT_OF_WORK],
      provide: AuthorizeSensitiveChange,
      useFactory: (work: AccountUnitOfWork) =>
        new AuthorizeSensitiveChange(work, Date.now),
    },
  ],
})
export class IdentityApplicationModule {}
