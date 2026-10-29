import { and, eq, lt, or } from "drizzle-orm";

import type { AppleRevocation } from "../../application/process-account-deletion.js";
import { gloupsAccount } from "./account-schema.js";
import { account, session } from "./auth-schema.js";
import type { Database } from "./database.js";
import { providerCredential } from "./provider-credentials-schema.js";

export const reconcileOrphanCredential = (
  db: Database,
  apple: AppleRevocation,
  now: Date
): Promise<void> =>
  db.transaction(async (transaction) => {
    const [intent] = await transaction
      .select()
      .from(providerCredential)
      .where(
        and(
          or(
            eq(providerCredential.phase, "prepared"),
            eq(providerCredential.phase, "reconcile")
          ),
          lt(providerCredential.retryAt, now)
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
      .select({ deletionId: gloupsAccount.deletionId, userId: account.userId })
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

      return;
    }

    // Only the approved synthetic local policy applies. Release startup is blocked.
    // Failed setup already returns manual Apple removal guidance to the caller.
    if (now.getTime() - intent.createdAt.getTime() >= 86_400_000) {
      await transaction
        .delete(providerCredential)
        .where(eq(providerCredential.id, intent.id));

      return;
    }

    // The revoker reads on its own connection and makes the provider request;
    // it does not mutate this transaction. A provider failure cannot roll back
    // tagged-session cleanup or the durable retry schedule below.
    const revoked = await apple.revoke(intent.id).then(
      () => true,
      () => false
    );

    if (revoked) {
      await transaction
        .delete(providerCredential)
        .where(eq(providerCredential.id, intent.id));

      return;
    }

    const attempts = intent.attempts + 1;
    await transaction
      .update(providerCredential)
      .set({
        attempts,
        phase: "reconcile",
        retryAt: new Date(
          now.getTime() +
            Math.min(1000 * 2 ** Math.min(attempts, 12), 3_600_000)
        ),
      })
      .where(eq(providerCredential.id, intent.id));
  });
