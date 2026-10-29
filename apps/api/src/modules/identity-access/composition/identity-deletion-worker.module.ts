/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { DeletionWorkerService } from "../infrastructure/deletion/deletion-worker.service.js";
import { DeletionApplicationModule } from "./deletion-application.module.js";
import { IdentityApplicationModule } from "./identity-application.module.js";

@Module({
  imports: [IdentityApplicationModule, DeletionApplicationModule],
  providers: [DeletionWorkerService],
})
export class IdentityDeletionWorkerModule {}
