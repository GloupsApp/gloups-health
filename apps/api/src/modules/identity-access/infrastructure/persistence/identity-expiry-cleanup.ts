import { and, isNotNull, lt } from "drizzle-orm";

import { appleChallenge } from "./apple-challenges.js";
import { verification } from "./auth-schema.js";
import type { Database } from "./database.js";
import { deletionJob, identityTombstone } from "./deletion-schema.js";
import {
  appleNotification,
  oauthLinkAttempt,
} from "./provider-credentials-schema.js";
import { issuedVerification } from "./verification-ledger.js";

export const cleanupExpiredIdentityState = async (
  db: Database
): Promise<void> => {
  const now = new Date();
  await db.transaction(async (transaction) => {
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
        lt(appleNotification.processedAt, new Date(now.getTime() - 172_800_000))
      );
  });
};
