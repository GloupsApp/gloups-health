import { setTimeout } from "node:timers/promises";

import { and, eq, isNotNull, lt, or } from "drizzle-orm";

import { readConfig } from "./config.js";
import { ProcessAccountDeletion } from "./modules/identity-access/application/process-account-deletion.js";
import { gloupsAccount } from "./modules/identity-access/infrastructure/persistence/account-schema.js";
import { appleChallenge } from "./modules/identity-access/infrastructure/persistence/apple-challenges.js";
import {
  createAppleRevocation,
  createIdentityRemoval,
} from "./modules/identity-access/infrastructure/persistence/auth-records-repository.js";
import {
  account,
  session,
  verification,
} from "./modules/identity-access/infrastructure/persistence/auth-schema.js";
import { createDatabase } from "./modules/identity-access/infrastructure/persistence/database.js";
import { DrizzleDeletionRepository } from "./modules/identity-access/infrastructure/persistence/deletion-repository.js";
import {
  deletionJob,
  identityTombstone,
} from "./modules/identity-access/infrastructure/persistence/deletion-schema.js";
import {
  appleNotification,
  oauthLinkAttempt,
  providerCredential,
} from "./modules/identity-access/infrastructure/persistence/provider-credentials-schema.js";
import { issuedVerification } from "./modules/identity-access/infrastructure/persistence/verification-ledger.js";

const main = async () => {
  const config = readConfig();
  const resource = createDatabase(config);
  const cancellation = new AbortController();
  process.once("SIGINT", () => cancellation.abort());
  process.once("SIGTERM", () => cancellation.abort());
  const apple = createAppleRevocation(resource.db, config);

  const jobs = {
    claim: (nowMs: number) =>
      resource.db.transaction((transaction) =>
        new DrizzleDeletionRepository(transaction, config).claim(nowMs)
      ),
    save: (claim: Parameters<DrizzleDeletionRepository["save"]>[0]) =>
      resource.db.transaction((transaction) =>
        new DrizzleDeletionRepository(transaction, config).save(claim)
      ),
  };

  const processor = new ProcessAccountDeletion(
    jobs,
    createIdentityRemoval(resource.db),
    apple,
    Date.now
  );

  const once = process.argv.includes("--once");

  const tick = async () => {
    const claim = await jobs.claim(Date.now());

    if (claim) {
      await processor.execute(claim);
    }

    await resource.db.transaction(async (transaction) => {
      const [intent] = await transaction
        .select()
        .from(providerCredential)
        .where(
          and(
            or(
              eq(providerCredential.phase, "prepared"),
              eq(providerCredential.phase, "reconcile")
            ),
            lt(providerCredential.retryAt, new Date())
          )
        )
        .for("update", { skipLocked: true })
        .limit(1);

      if (!intent) {
        return;
      }

      await transaction
        .delete(session)
        .where(eq(session.nativeSetupId, intent.id));

      const [owner] = await transaction
        .select({
          deletionId: gloupsAccount.deletionId,
          userId: account.userId,
        })
        .from(account)
        .leftJoin(gloupsAccount, eq(gloupsAccount.authUserId, account.userId))
        .where(
          and(
            eq(account.providerId, "apple"),
            eq(account.accountId, intent.appleSubject)
          )
        )
        .limit(1);

      if (
        owner &&
        !owner.deletionId &&
        (!intent.expectedActorId || intent.expectedActorId === owner.userId)
      ) {
        await transaction
          .update(providerCredential)
          .set({
            authUserId: owner.userId,
            expectedActorId: null,
            phase: "bound",
          })
          .where(eq(providerCredential.id, intent.id));
      } else {
        await apple.revoke(intent.id);
        await transaction
          .delete(providerCredential)
          .where(eq(providerCredential.id, intent.id));
      }
    });
    const now = new Date();
    await resource.db.transaction(async (transaction) => {
      await transaction
        .delete(identityTombstone)
        .where(lt(identityTombstone.expiresAt, now));
      await transaction
        .delete(deletionJob)
        .where(
          and(
            isNotNull(deletionJob.completedAt),
            lt(deletionJob.completedAt, new Date(now.getTime() - 86_400_000))
          )
        );
      await transaction
        .delete(appleChallenge)
        .where(lt(appleChallenge.expiresAt, now));
      await transaction
        .delete(oauthLinkAttempt)
        .where(lt(oauthLinkAttempt.expiresAt, now));
      await transaction
        .delete(issuedVerification)
        .where(lt(issuedVerification.expiresAt, now));
      await transaction
        .delete(verification)
        .where(lt(verification.expiresAt, now));
      await transaction
        .delete(appleNotification)
        .where(
          lt(
            appleNotification.processedAt,
            new Date(now.getTime() - 172_800_000)
          )
        );
    });
  };

  try {
    while (!cancellation.signal.aborted) {
      try {
        // Each tick finishes its durable handoff before the next claim.
        // oxlint-disable-next-line no-await-in-loop
        await tick();
      } catch {
        process.stderr.write("Authentication worker retry pending.\n");
      }

      if (once) {
        break;
      }

      if (!cancellation.signal.aborted) {
        // oxlint-disable-next-line no-await-in-loop
        await setTimeout(1000, undefined, {
          signal: cancellation.signal,
        }).catch(() => {
          // An aborted delay ends the worker after the current handoff.
        });
      }
    }
  } finally {
    await resource.close();
  }
};

main().catch(() => {
  process.stderr.write("Authentication worker unavailable.\n");
  process.exitCode = 1;
});
