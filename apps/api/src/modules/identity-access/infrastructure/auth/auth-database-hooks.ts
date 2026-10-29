import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";

import type { ApiConfig } from "../../../../config.js";
import { gloupsAccount } from "../persistence/account-schema.js";
import type { Database } from "../persistence/database.js";
import { nativeAppleProof } from "./apple-proof-context.js";
import { verifiedProviderFingerprint } from "./auth-request-scope.js";
import { identityFingerprint } from "./identity-fingerprint.js";

export const createDatabaseHooks = (db: Database, config: ApiConfig) => ({
  account: {
    create: {
      before: (value: {
        userId: string;
        providerId: string;
        accountId: string;
      }) =>
        Promise.resolve({
          data: {
            ...value,
            identityFingerprint: identityFingerprint(
              config,
              "identity",
              value.userId
            ),
            nativeSetupId: nativeAppleProof()?.intentId ?? null,
            subjectFingerprint: identityFingerprint(
              config,
              "subject",
              `${value.providerId}:${value.accountId}`
            ),
          },
        }),
    },
  },
  session: {
    create: {
      before: async (value: { userId: string }) => {
        const [account] = await db
          .select({ deletionId: gloupsAccount.deletionId })
          .from(gloupsAccount)
          .where(eq(gloupsAccount.authUserId, value.userId))
          .limit(1);

        if (account?.deletionId) {
          throw new APIError("FORBIDDEN", {
            code: "ACCOUNT_DELETING",
            message: "Account deletion is pending.",
          });
        }

        return {
          data: {
            ...value,
            identityFingerprint: identityFingerprint(
              config,
              "identity",
              value.userId
            ),
            nativeSetupId: nativeAppleProof()?.intentId ?? null,
          },
        };
      },
    },
  },
  user: {
    create: {
      before: (value: { email: string }) =>
        Promise.resolve({
          data: {
            ...value,
            emailFingerprint: identityFingerprint(
              config,
              "email",
              value.email.toLowerCase()
            ),
            nativeSetupId: nativeAppleProof()?.intentId ?? null,
            providerFingerprint: verifiedProviderFingerprint() ?? null,
          },
        }),
    },
  },
});
