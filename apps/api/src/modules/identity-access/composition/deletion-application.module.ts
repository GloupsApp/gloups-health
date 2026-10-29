/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { randomUUID } from "node:crypto";

import { Module } from "@nestjs/common";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { ApiConfigurationModule } from "../../../platform/configuration/api-configuration.module.js";
import { DELETION_UNIT_OF_WORK } from "../application/ports/deletion-unit-of-work.port.js";
import type { DeletionUnitOfWork } from "../application/ports/deletion-unit-of-work.port.js";
import {
  DELETION_JOBS,
  IDENTITY_REMOVAL,
  APPLE_REVOCATION,
} from "../application/ports/deletion-worker.port.js";
import type { DeletionJobs } from "../application/ports/deletion-worker.port.js";
import { ProcessAccountDeletion } from "../application/process-account-deletion.js";
import type {
  IdentityRemoval,
  AppleRevocation,
} from "../application/process-account-deletion.js";
import { RequestAccountDeletion } from "../application/request-account-deletion.js";
import {
  createIdentityRemoval,
  createAppleRevocation,
} from "../infrastructure/persistence/auth-records-repository.js";
import { DATABASE } from "../infrastructure/persistence/database.js";
import type { DatabaseResource } from "../infrastructure/persistence/database.js";
import { DrizzleDeletionRepository } from "../infrastructure/persistence/deletion-repository.js";
import { DrizzleDeletionUnitOfWork } from "../infrastructure/persistence/deletion-unit-of-work.js";
import { IdentityPersistenceModule } from "./identity-persistence.module.js";

@Module({
  exports: [
    RequestAccountDeletion,
    ProcessAccountDeletion,
    DELETION_JOBS,
    APPLE_REVOCATION,
  ],
  imports: [IdentityPersistenceModule, ApiConfigurationModule],
  providers: [
    {
      inject: [DATABASE, API_CONFIG],
      provide: DELETION_UNIT_OF_WORK,
      useFactory: (resource: DatabaseResource, config: ApiConfig) =>
        new DrizzleDeletionUnitOfWork(resource.db, resource.proofDb, config),
    },
    {
      inject: [DATABASE, API_CONFIG],
      provide: DELETION_JOBS,
      useFactory: (
        resource: DatabaseResource,
        config: ApiConfig
      ): DeletionJobs => ({
        claim: (nowMs) =>
          resource.db.transaction((tx) =>
            new DrizzleDeletionRepository(tx, config).claim(nowMs)
          ),
        save: (claim) =>
          resource.db.transaction((tx) =>
            new DrizzleDeletionRepository(tx, config).save(claim)
          ),
      }),
    },
    {
      inject: [DATABASE],
      provide: IDENTITY_REMOVAL,
      useFactory: (resource: DatabaseResource) =>
        createIdentityRemoval(resource.db, resource.proofDb),
    },
    {
      inject: [DATABASE, API_CONFIG],
      provide: APPLE_REVOCATION,
      useFactory: (resource: DatabaseResource, config: ApiConfig) =>
        createAppleRevocation(resource.db, config),
    },
    {
      inject: [DELETION_UNIT_OF_WORK],
      provide: RequestAccountDeletion,
      useFactory: (work: DeletionUnitOfWork) =>
        new RequestAccountDeletion(work, Date.now, randomUUID),
    },
    {
      inject: [DELETION_JOBS, IDENTITY_REMOVAL, APPLE_REVOCATION],
      provide: ProcessAccountDeletion,
      useFactory: (
        jobs: DeletionJobs,
        identities: IdentityRemoval,
        apple: AppleRevocation
      ) => new ProcessAccountDeletion(jobs, identities, apple, Date.now),
    },
  ],
})
export class DeletionApplicationModule {}
