import { deletionReceipt } from "../domain/deletion-job.js";
import type { DeletionReceipt } from "../domain/deletion-job.js";
import { GloupsAccount } from "../domain/gloups-account.js";
import type { DeletionUnitOfWork } from "./ports/deletion-unit-of-work.port.js";
import { AccessFailureError } from "./types.js";
import type { VerifiedIdentity } from "./types.js";

export class RequestAccountDeletion {
  private readonly work: DeletionUnitOfWork;
  private readonly nowMs: () => number;
  private readonly nextId: () => string;
  constructor(
    work: DeletionUnitOfWork,
    nowMs: () => number,
    nextId: () => string
  ) {
    this.work = work;
    this.nowMs = nowMs;
    this.nextId = nextId;
  }
  execute(
    actor: VerifiedIdentity,
    input: { readonly idempotencyKey: string }
  ): Promise<DeletionReceipt> {
    const now = this.nowMs();
    const age = now - actor.authenticatedAtMs;

    if (!actor.emailVerified) {
      throw new AccessFailureError("EMAIL_UNVERIFIED");
    }

    if (!Number.isFinite(age) || age < 0 || age > 300_000) {
      throw new AccessFailureError("FRESH_AUTH_REQUIRED");
    }

    return this.work.runForActor(
      actor.authUserId,
      async ({ accounts, deletions }) => {
        const prior = await deletions.findForActorKey(
          actor.authUserId,
          input.idempotencyKey
        );

        if (prior) {
          return deletionReceipt(prior);
        }

        let account = await accounts.findByIdentity(actor.authUserId);

        if (!account) {
          await accounts.insert(
            GloupsAccount.create(this.nextId(), actor.authUserId, now)
          );
          account = await accounts.findByIdentity(actor.authUserId);
        }

        if (!account || account.isDeleting) {
          throw new AccessFailureError("ACCOUNT_DELETING");
        }

        const id = this.nextId();
        await accounts.save(account.beginDeletion(id));

        const reservation = await deletions.reserveIdentity(
          actor.authUserId,
          id
        );

        const job = {
          ...reservation,
          accountId: account.id,
          attempts: 0,
          authUserId: actor.authUserId,
          completedAtMs: null,
          createdAtMs: now,
          gloups: "pending" as const,
          id,
          idempotencyKey: input.idempotencyKey,
          retryAtMs: now,
        };

        await deletions.enqueue(job);

        return deletionReceipt(job);
      }
    );
  }
}
