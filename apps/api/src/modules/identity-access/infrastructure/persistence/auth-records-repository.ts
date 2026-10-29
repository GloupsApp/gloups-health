import { eq, or, sql } from "drizzle-orm";

import type { ApiConfig } from "../../../../config.js";
import type {
  IdentityRemoval,
  AppleRevocation,
} from "../../application/process-account-deletion.js";
import { appleClientSecret } from "../auth/apple-client-secret.js";
import { createTokenVault } from "../auth/token-vault.js";
import { gloupsAccount } from "./account-schema.js";
import { appleChallenge } from "./apple-challenges.js";
import { user, verification } from "./auth-schema.js";
import type { Database } from "./database.js";
import { withIdentityProofLock } from "./identity-proof-lock.js";
import {
  oauthLinkAttempt,
  providerCredential,
} from "./provider-credentials-schema.js";

export const createIdentityRemoval = (
  db: Database,
  proofDb: Database
): IdentityRemoval => ({
  async erase(authUserId: string): Promise<void> {
    await withIdentityProofLock(proofDb, authUserId, () =>
      db.transaction(async (transaction) => {
        const attempts = await transaction
          .select({ id: oauthLinkAttempt.id })
          .from(oauthLinkAttempt)
          .where(eq(oauthLinkAttempt.authUserId, authUserId));

        await transaction
          .delete(verification)
          .where(
            or(
              eq(verification.value, authUserId),
              ...attempts.map(
                (attempt) =>
                  sql`${verification.value} like ${`%${attempt.id}%`}`
              )
            )
          );
        await transaction
          .delete(appleChallenge)
          .where(eq(appleChallenge.actorAuthUserId, authUserId));
        await transaction
          .delete(oauthLinkAttempt)
          .where(eq(oauthLinkAttempt.authUserId, authUserId));
        await transaction
          .delete(gloupsAccount)
          .where(eq(gloupsAccount.authUserId, authUserId));
        // Generated schema FKs erase accounts, sessions and issuing-user ledgers.
        await transaction.delete(user).where(eq(user.id, authUserId));
      })
    );
  },
});

export const createAppleRevocation = (
  db: Database,
  config: ApiConfig
): AppleRevocation => ({
  async revoke(credentialRef: string): Promise<"revoked" | "manual_required"> {
    const [row] = await db
      .select()
      .from(providerCredential)
      .where(eq(providerCredential.id, credentialRef))
      .limit(1);

    if (!row?.ciphertext) {
      return "manual_required";
    }

    if (!config.apple) {
      throw new Error(
        "Apple configuration unavailable for pending revocation."
      );
    }

    const credential = await createTokenVault(config.tokenKeyring).open(
      row.ciphertext
    );

    const response = await fetch("https://appleid.apple.com/auth/revoke", {
      body: new URLSearchParams({
        client_id: credential.clientId,
        client_secret: await appleClientSecret(
          config.apple,
          credential.clientId
        ),
        token: credential.refreshToken,
        token_type_hint: "refresh_token",
      }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      return "revoked";
    }

    // Provider errors retry; a missing/invalid client secret must never imply completion.
    throw new Error("Apple revocation unavailable.");
  },
});
