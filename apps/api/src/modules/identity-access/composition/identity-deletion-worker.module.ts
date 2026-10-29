/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { DeletionWorkerService } from "../infrastructure/deletion/deletion-worker.service.js";
import { DeletionApplicationModule } from "./deletion-application.module.js";
import { IdentityPersistenceModule } from "./identity-persistence.module.js";

@Module({
  imports: [IdentityPersistenceModule, DeletionApplicationModule],
  providers: [DeletionWorkerService],
})
export class IdentityDeletionWorkerModule {}
