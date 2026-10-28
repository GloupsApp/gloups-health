export type AppleDeletionStatus =
  | "pending"
  | "complete"
  | "manual_required"
  | "not_applicable";

export interface DeletionReceipt {
  readonly deletionId: string;
  readonly gloups: "deleted" | "pending";
  readonly appleRevocation: AppleDeletionStatus;
}

export interface DeletionJob {
  readonly id: string;
  readonly accountId: string;
  readonly actorFingerprint: string;
  readonly authUserId: string | null;
  readonly idempotencyKey: string;
  readonly createdAtMs: number;
  readonly retryAtMs: number;
  readonly completedAtMs: number | null;
  readonly attempts: number;
  readonly requiresManual: boolean;
  readonly gloups: "deleted" | "pending";
  readonly appleRevocation: AppleDeletionStatus;
  readonly credentialRefs: readonly string[];
}

export interface ClaimedDeletionJob {
  readonly job: DeletionJob;
  readonly leaseId: string;
  readonly leaseUntilMs: number;
}

export interface DeletionRepository {
  lockActor: (authUserId: string) => Promise<void>;
  findByKey: (accountId: string, key: string) => Promise<DeletionJob | null>;
  findForActorKey: (
    authUserId: string,
    key: string
  ) => Promise<DeletionJob | null>;
  reserveIdentity: (
    authUserId: string,
    deletionId: string
  ) => Promise<{
    credentialRefs: readonly string[];
    appleRevocation: AppleDeletionStatus;
    requiresManual: boolean;
    actorFingerprint: string;
  }>;
  enqueue: (job: DeletionJob) => Promise<void>;
  claim: (nowMs: number) => Promise<ClaimedDeletionJob | null>;
  save: (claim: ClaimedDeletionJob) => Promise<void>;
}

export const deletionReceipt = (job: DeletionJob): DeletionReceipt => ({
  appleRevocation: job.appleRevocation,
  deletionId: job.id,
  gloups: job.gloups,
});
