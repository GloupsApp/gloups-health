import type {
  ClaimedDeletionJob,
  DeletionJob,
  DeletionRepository,
} from "../domain/deletion-job.js";

export interface IdentityRemoval {
  erase: (authUserId: string) => Promise<void>;
}

export interface AppleRevocation {
  revoke: (credentialRef: string) => Promise<"revoked" | "manual_required">;
}

export class ProcessAccountDeletion {
  private readonly jobs: Pick<DeletionRepository, "save">;
  private readonly identities: IdentityRemoval;
  private readonly apple: AppleRevocation;
  private readonly nowMs: () => number;
  constructor(
    jobs: Pick<DeletionRepository, "save">,
    identities: IdentityRemoval,
    apple: AppleRevocation,
    nowMs: () => number
  ) {
    this.jobs = jobs;
    this.identities = identities;
    this.apple = apple;
    this.nowMs = nowMs;
  }
  async execute(claim: ClaimedDeletionJob): Promise<void> {
    let job: DeletionJob = claim.job;

    try {
      if (job.gloups === "pending" && job.authUserId) {
        await this.identities.erase(job.authUserId);
        job = { ...job, authUserId: null, gloups: "deleted" };
        await this.jobs.save({ ...claim, job });
      }

      if (job.appleRevocation === "pending") {
        const results = await Promise.all(
          job.credentialRefs.map((ref) => this.apple.revoke(ref))
        );

        job = {
          ...job,
          appleRevocation:
            job.requiresManual || results.includes("manual_required")
              ? "manual_required"
              : "complete",
        };
      }

      await this.jobs.save({
        ...claim,
        job: { ...job, completedAtMs: this.nowMs() },
      });
    } catch {
      const attempts = job.attempts + 1;
      // Local synthetic fallback only; live retention and retry policy still block release.
      const expired = this.nowMs() - job.createdAtMs >= 86_400_000;
      await this.jobs.save({
        ...claim,
        job: {
          ...job,
          appleRevocation:
            expired && job.gloups === "deleted"
              ? "manual_required"
              : job.appleRevocation,
          attempts,
          completedAtMs:
            expired && job.gloups === "deleted" ? this.nowMs() : null,
          retryAtMs:
            this.nowMs() +
            Math.min(1000 * 2 ** Math.min(attempts, 12), 3_600_000),
        },
      });
    }
  }
}
