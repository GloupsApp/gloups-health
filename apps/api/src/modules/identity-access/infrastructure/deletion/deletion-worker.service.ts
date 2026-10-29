import { setTimeout } from "node:timers/promises";

import { Inject, Injectable } from "@nestjs/common";
import type { BeforeApplicationShutdown } from "@nestjs/common";

import {
  DELETION_JOBS,
  APPLE_REVOCATION,
} from "../../application/ports/deletion-worker.port.js";
import type { DeletionJobs } from "../../application/ports/deletion-worker.port.js";
import { ProcessAccountDeletion } from "../../application/process-account-deletion.js";
import type { AppleRevocation } from "../../application/process-account-deletion.js";
import { DATABASE } from "../persistence/database.js";
import type { DatabaseResource } from "../persistence/database.js";
import { cleanupExpiredIdentityState } from "../persistence/identity-expiry-cleanup.js";
import { reconcileOrphanCredential } from "../persistence/orphan-credentials.js";

const reportRetry = () => {
  process.stderr.write("Authentication worker retry pending.\n");
};

@Injectable()
export class DeletionWorkerService implements BeforeApplicationShutdown {
  private readonly cancellation = new AbortController();
  private readonly processor: ProcessAccountDeletion;
  private readonly jobs: DeletionJobs;
  private readonly database: DatabaseResource;
  private readonly apple: AppleRevocation;
  private pending: Promise<void> | undefined;
  constructor(
    @Inject(ProcessAccountDeletion) processor: ProcessAccountDeletion,
    @Inject(DELETION_JOBS) jobs: DeletionJobs,
    @Inject(DATABASE) database: DatabaseResource,
    @Inject(APPLE_REVOCATION) apple: AppleRevocation
  ) {
    this.processor = processor;
    this.jobs = jobs;
    this.database = database;
    this.apple = apple;
  }
  async beforeApplicationShutdown(): Promise<void> {
    this.cancellation.abort();
    await this.pending;
  }
  private async processNext(): Promise<void> {
    const claim = await this.jobs.claim(Date.now());

    if (claim) {
      await this.processor.execute(claim);
    }
  }
  private async tick(): Promise<void> {
    await this.processNext().catch(reportRetry);
    await reconcileOrphanCredential(
      this.database.db,
      this.apple,
      new Date()
    ).catch(reportRetry);
    await cleanupExpiredIdentityState(this.database.db);
  }
  async run(once: boolean): Promise<void> {
    while (!this.cancellation.signal.aborted) {
      this.pending = this.tick().catch(reportRetry);
      // oxlint-disable-next-line no-await-in-loop -- Finish each durable handoff before another claim.
      await this.pending;
      this.pending = undefined;

      if (once) {
        return;
      }

      // oxlint-disable-next-line no-await-in-loop -- Serialized worker tick; shutdown aborts the delay.
      await setTimeout(1000, undefined, {
        signal: this.cancellation.signal,
      }).catch(() => {
        /* Shutdown ends the loop. */
      });
    }
  }
}
