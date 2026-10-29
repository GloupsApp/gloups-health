import { randomUUID } from "node:crypto";

import { symmetricDecrypt } from "better-auth/crypto";
import { and, eq, gt, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";

import type { ApiConfig } from "../../../../config.js";
import type {
  ClaimedDeletionJob,
  DeletionJob,
  DeletionRepository,
} from "../../domain/deletion-job.js";
import { identityFingerprint } from "../auth/identity-fingerprint.js";
import { createTokenVault } from "../auth/token-vault.js";
import type { IdentityTransaction } from "./account-repository.js";
import { account, session, user } from "./auth-schema.js";
import { deletionJob, identityTombstone } from "./deletion-schema.js";
import { providerCredential } from "./provider-credentials-schema.js";

type StoredJob = typeof deletionJob.$inferSelect;

const restoreJob = (row: StoredJob): DeletionJob => ({
  accountId: row.accountId,
  actorFingerprint: row.actorFingerprint,
  appleRevocation: row.appleRevocation,
  attempts: row.attempts,
  authUserId: row.authUserId,
  completedAtMs: row.completedAt?.getTime() ?? null,
  createdAtMs: row.createdAt.getTime(),
  credentialRefs: row.credentialRefs,
  gloups: row.gloups,
  id: row.id,
  idempotencyKey: row.idempotencyKey,
  requiresManual: row.requiresManual,
  retryAtMs: row.retryAt.getTime(),
});

const storeJob = (job: DeletionJob) => ({
  accountId: job.accountId,
  actorFingerprint: job.actorFingerprint,
  appleRevocation: job.appleRevocation,
  attempts: job.attempts,
  authUserId: job.authUserId,
  completedAt: job.completedAtMs === null ? null : new Date(job.completedAtMs),
  createdAt: new Date(job.createdAtMs),
  credentialRefs: [...job.credentialRefs],
  gloups: job.gloups,
  id: job.id,
  idempotencyKey: job.idempotencyKey,
  requiresManual: job.requiresManual,
  retryAt: new Date(job.retryAtMs),
});

export class DrizzleDeletionRepository implements DeletionRepository {
  private readonly db: IdentityTransaction;
  private readonly config: ApiConfig;
  constructor(db: IdentityTransaction, config: ApiConfig) {
    this.db = db;
    this.config = config;
  }
  async findByKey(accountId: string, key: string): Promise<DeletionJob | null> {
    const [row] = await this.db
      .select()
      .from(deletionJob)
      .where(
        and(
          eq(deletionJob.accountId, accountId),
          eq(deletionJob.idempotencyKey, key)
        )
      )
      .limit(1);

    return row ? restoreJob(row) : null;
  }
  async findForActorKey(
    authUserId: string,
    key: string
  ): Promise<DeletionJob | null> {
    const fingerprint = identityFingerprint(
      this.config,
      "identity",
      authUserId
    );

    const [row] = await this.db
      .select()
      .from(deletionJob)
      .where(
        and(
          eq(deletionJob.actorFingerprint, fingerprint),
          eq(deletionJob.idempotencyKey, key)
        )
      )
      .limit(1);

    return row ? restoreJob(row) : null;
  }
  async reserveIdentity(authUserId: string, deletionId: string) {
    const [identity] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, authUserId))
      .limit(1);

    if (!identity) {
      throw new Error("Deletion identity is missing.");
    }

    const actorFingerprint = identityFingerprint(
      this.config,
      "identity",
      authUserId
    );

    const emailFingerprint = identityFingerprint(
      this.config,
      "email",
      identity.email.toLowerCase()
    );

    await this.db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${emailFingerprint}, 0))`
    );
    await this.db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${actorFingerprint}, 0))`
    );

    const methods = await this.db
      .select()
      .from(account)
      .where(eq(account.userId, authUserId));

    const subjects = methods
      .map((method) =>
        identityFingerprint(
          this.config,
          "subject",
          `${method.providerId}:${method.accountId}`
        )
      )
      .toSorted();

    // Acquire in stable order, matching the SDK write guards.
    for (const fingerprint of subjects) {
      // oxlint-disable-next-line no-await-in-loop
      await this.db.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${fingerprint}, 0))`
      );
    }

    const appleMethods = methods.filter(
      (method) => method.providerId === "apple"
    );

    const native = await this.db
      .select()
      .from(providerCredential)
      .where(
        or(
          eq(providerCredential.authUserId, authUserId),
          eq(providerCredential.expectedActorId, authUserId),
          inArray(
            providerCredential.appleSubject,
            appleMethods.map((method) => method.accountId)
          )
        )
      )
      .for("update");

    const credentialRefs = native
      .filter((row) => Boolean(row.ciphertext))
      .map((row) => row.id);

    let requiresManual = appleMethods.some(
      (method) =>
        !method.refreshToken &&
        !native.some(
          (row) => row.appleSubject === method.accountId && row.ciphertext
        )
    );

    const vault = createTokenVault(this.config.tokenKeyring);

    for (const method of appleMethods.filter((row) => row.refreshToken)) {
      const id = randomUUID();
      let ciphertext: string;

      try {
        // The public SDK crypto export opens its encrypted browser credential.
        // oxlint-disable-next-line no-await-in-loop
        const refreshToken = await symmetricDecrypt({
          data: method.refreshToken ?? "",
          key: this.config.secret,
        });

        // oxlint-disable-next-line no-await-in-loop
        ciphertext = await vault.seal({
          clientId: this.config.apple?.serviceId ?? "",
          refreshToken,
          subject: method.accountId,
        });
      } catch {
        requiresManual = true;
        continue;
      }

      // oxlint-disable-next-line no-await-in-loop
      await this.db.insert(providerCredential).values({
        appleSubject: "",
        authUserId: null,
        ciphertext,
        clientId: this.config.apple?.serviceId ?? "",
        createdAt: new Date(),
        expectedActorId: null,
        id,
        phase: "bound",
        retryAt: new Date(),
      });
      credentialRefs.push(id);
    }

    if (native.length) {
      await this.db
        .update(providerCredential)
        .set({
          appleSubject: "",
          authUserId: null,
          expectedActorId: null,
          phase: "bound",
        })
        .where(
          inArray(
            providerCredential.id,
            native.map((row) => row.id)
          )
        );
    }

    await this.db
      .insert(identityTombstone)
      .values(
        [emailFingerprint, actorFingerprint, ...subjects].map(
          (fingerprint) => ({ deletionId, expiresAt: null, fingerprint })
        )
      )
      .onConflictDoUpdate({
        set: { deletionId, expiresAt: null },
        target: identityTombstone.fingerprint,
      });
    await this.db.delete(session).where(eq(session.userId, authUserId));

    let appleRevocation: "not_applicable" | "pending" | "manual_required" =
      "not_applicable";

    if (appleMethods.length || native.length) {
      appleRevocation = credentialRefs.length ? "pending" : "manual_required";
    }

    return {
      actorFingerprint,
      appleRevocation,
      credentialRefs,
      requiresManual,
    };
  }
  async enqueue(job: DeletionJob): Promise<void> {
    await this.db.insert(deletionJob).values(storeJob(job));
  }
  async claim(nowMs: number): Promise<ClaimedDeletionJob | null> {
    const now = new Date(nowMs);

    const [row] = await this.db
      .select()
      .from(deletionJob)
      .where(
        and(
          isNull(deletionJob.completedAt),
          lte(deletionJob.retryAt, now),
          or(isNull(deletionJob.leaseUntil), lt(deletionJob.leaseUntil, now))
        )
      )
      .orderBy(deletionJob.retryAt)
      .for("update", { skipLocked: true })
      .limit(1);

    if (!row) {
      return null;
    }

    const leaseId = randomUUID();
    const leaseUntilMs = nowMs + 120_000;
    await this.db
      .update(deletionJob)
      .set({ leaseId, leaseUntil: new Date(leaseUntilMs) })
      .where(eq(deletionJob.id, row.id));

    return { job: restoreJob(row), leaseId, leaseUntilMs };
  }
  async save(claim: ClaimedDeletionJob): Promise<void> {
    const result = await this.db
      .update(deletionJob)
      .set(storeJob(claim.job))
      .where(
        and(
          eq(deletionJob.id, claim.job.id),
          eq(deletionJob.leaseId, claim.leaseId),
          gt(deletionJob.leaseUntil, new Date())
        )
      )
      .returning({ id: deletionJob.id });

    if (!result.length) {
      throw new Error("Deletion lease expired.");
    }

    if (claim.job.completedAtMs !== null) {
      if (claim.job.credentialRefs.length) {
        await this.db
          .delete(providerCredential)
          .where(inArray(providerCredential.id, [...claim.job.credentialRefs]));
      }

      await this.db
        .update(deletionJob)
        .set({ credentialRefs: [], leaseId: null, leaseUntil: null })
        .where(
          and(
            eq(deletionJob.id, claim.job.id),
            eq(deletionJob.leaseId, claim.leaseId)
          )
        );
      await this.db
        .update(identityTombstone)
        .set({ expiresAt: new Date(claim.job.completedAtMs + 3_660_000) })
        .where(eq(identityTombstone.deletionId, claim.job.id));
    } else if (claim.job.retryAtMs > Date.now()) {
      await this.db
        .update(deletionJob)
        .set({ leaseId: null, leaseUntil: null })
        .where(
          and(
            eq(deletionJob.id, claim.job.id),
            eq(deletionJob.leaseId, claim.leaseId)
          )
        );
    }
  }
}
