import { createHash, randomUUID } from "node:crypto";

import type { Database } from "@database/public";
import { authSchema } from "@database/public";
import { and, eq, gt, inArray, like, lt, ne, sql } from "drizzle-orm";

const { account, providerRevocation, session, user, verification } = authSchema;

const verificationKey = (token: string) =>
  `email-verification:${createHash("sha256").update(token).digest("hex")}`;

export const createSecurityStore = (database: Database) => {
  const methods = async (userId: string) => {
    const accounts = await database
      .select()
      .from(account)
      .where(eq(account.userId, userId));

    const revocations =
      accounts.length === 0
        ? []
        : await database
            .select()
            .from(providerRevocation)
            .where(
              inArray(
                providerRevocation.id,
                accounts.map(
                  (method) => `${method.providerId}:${method.accountId}`
                )
              )
            );

    return accounts.map((method) => {
      const revoked = revocations.find(
        (item) => item.id === `${method.providerId}:${method.accountId}`
      );

      return {
        available:
          method.providerId === "credential"
            ? Boolean(method.password)
            : ["apple", "google"].includes(method.providerId) &&
              (!revoked ||
                (!revoked.disabled &&
                  Math.floor(method.updatedAt.getTime() / 1000) >
                    Math.floor(revoked.revokedAt.getTime() / 1000))),
        id: method.id,
        providerId: method.providerId,
      };
    });
  };

  return {
    addPassword: (userId: string, sessionId: string, password: string) =>
      database.transaction(async (transaction) => {
        await transaction
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, userId))
          .for("update");

        const [live] = await transaction
          .select({ id: session.id })
          .from(session)
          .where(
            and(
              eq(session.id, sessionId),
              eq(session.userId, userId),
              gt(session.expiresAt, new Date())
            )
          );

        if (!live) {
          return "FRESH_SESSION_REQUIRED";
        }

        const [existing] = await transaction
          .select({ id: account.id })
          .from(account)
          .where(
            and(
              eq(account.userId, userId),
              eq(account.providerId, "credential")
            )
          );

        if (existing) {
          return "PASSWORD_ALREADY_SET";
        }

        await transaction.insert(account).values({
          accountId: userId,
          id: randomUUID(),
          password,
          providerId: "credential",
          userId,
        });

        await transaction
          .delete(verification)
          .where(
            and(
              eq(verification.value, userId),
              like(verification.identifier, "reset-password:%")
            )
          );

        return null;
      }),
    consumeVerification: async (token: string) => {
      const claimed = await database
        .update(verification)
        .set({ updatedAt: new Date(), value: "used" })
        .where(
          and(
            eq(verification.identifier, verificationKey(token)),
            gt(verification.expiresAt, new Date()),
            ne(verification.value, "used")
          )
        )
        .returning({ id: verification.id });

      return claimed.length > 0;
    },
    hasPassword: async (userId: string) => {
      const [credential] = await database
        .select({ password: account.password })
        .from(account)
        .where(
          and(eq(account.userId, userId), eq(account.providerId, "credential"))
        );

      return Boolean(credential?.password);
    },
    isLiveSession: async (id: string, userId: string) => {
      const [live] = await database
        .select({ id: session.id })
        .from(session)
        .where(
          and(
            eq(session.id, id),
            eq(session.userId, userId),
            gt(session.expiresAt, new Date())
          )
        );

      return Boolean(live);
    },
    methods,
    providerIdentity: async (provider: string, subject: string) => {
      const [identity] = await database
        .select({ email: user.email, emailVerified: user.emailVerified })
        .from(account)
        .innerJoin(user, eq(user.id, account.userId))
        .where(
          and(eq(account.providerId, provider), eq(account.accountId, subject))
        );

      return identity;
    },
    registerVerification: async (token: string, userId: string) => {
      await database
        .insert(verification)
        .values({
          expiresAt: new Date(Date.now() + 3_600_000),
          id: randomUUID(),
          identifier: verificationKey(token),
          value: userId,
        })
        .onConflictDoNothing();
    },
    revocation: async (provider: string, subject: string) => {
      const [revoked] = await database
        .select()
        .from(providerRevocation)
        .where(eq(providerRevocation.id, `${provider}:${subject}`));

      return revoked;
    },
    revokeProvider: (
      provider: string,
      subject: string,
      at: Date,
      disabled: boolean
    ) =>
      database.transaction(async (transaction) => {
        const [method] = await transaction
          .select()
          .from(account)
          .where(
            and(
              eq(account.providerId, provider),
              eq(account.accountId, subject)
            )
          );

        if (!method) {
          return;
        }

        await transaction
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, method.userId))
          .for("update");

        const changed = await transaction
          .insert(providerRevocation)
          .values({
            disabled,
            id: `${provider}:${subject}`,
            revokedAt: at,
          })
          .onConflictDoUpdate({
            set: { disabled, revokedAt: at, updatedAt: new Date() },
            setWhere: disabled
              ? sql`${lt(providerRevocation.revokedAt, at)} or (${eq(providerRevocation.revokedAt, at)} and ${eq(providerRevocation.disabled, false)})`
              : lt(providerRevocation.revokedAt, at),
            target: providerRevocation.id,
          })
          .returning({ id: providerRevocation.id });

        if (changed.length > 0) {
          await transaction
            .delete(session)
            .where(eq(session.userId, method.userId));
          await transaction
            .delete(verification)
            .where(
              and(
                eq(verification.value, method.userId),
                like(verification.identifier, "reset-password:%")
              )
            );
        }
      }),
    unlink: (userId: string, sessionId: string, id: string) =>
      database.transaction(async (transaction) => {
        // Serialize method removals for this person, including requests on other devices.
        await transaction
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, userId))
          .for("update");

        const [live] = await transaction
          .select({ id: session.id })
          .from(session)
          .where(
            and(
              eq(session.id, sessionId),
              eq(session.userId, userId),
              gt(session.expiresAt, new Date())
            )
          );

        if (!live) {
          return "FRESH_SESSION_REQUIRED";
        }

        const accounts = await transaction
          .select()
          .from(account)
          .where(eq(account.userId, userId));

        const target = accounts.find((method) => method.id === id);

        if (!target) {
          return "ACCOUNT_NOT_FOUND";
        }

        const revocations = await transaction
          .select()
          .from(providerRevocation)
          .where(
            inArray(
              providerRevocation.id,
              accounts.map(
                (method) => `${method.providerId}:${method.accountId}`
              )
            )
          );

        const recoverable = accounts.some((method) => {
          if (method.id === id) {
            return false;
          }

          if (method.providerId === "credential") {
            return Boolean(method.password);
          }

          const revoked = revocations.find(
            (item) => item.id === `${method.providerId}:${method.accountId}`
          );

          return (
            ["apple", "google"].includes(method.providerId) &&
            (!revoked ||
              (!revoked.disabled &&
                Math.floor(method.updatedAt.getTime() / 1000) >
                  Math.floor(revoked.revokedAt.getTime() / 1000)))
          );
        });

        if (!recoverable) {
          return "FAILED_TO_UNLINK_LAST_ACCOUNT";
        }

        await transaction.delete(account).where(eq(account.id, id));
        await transaction.delete(session).where(eq(session.userId, userId));
        await transaction
          .delete(verification)
          .where(
            and(
              eq(verification.value, userId),
              like(verification.identifier, "reset-password:%")
            )
          );

        return null;
      }),
  };
};

export type SecurityStore = ReturnType<typeof createSecurityStore>;
