import { randomUUID } from "node:crypto";

import type { BetterAuthOptions } from "better-auth";
import { APIError, getOAuthState } from "better-auth/api";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import type { AuthorizeSensitiveChange } from "../../application/authorize-sensitive-change.js";
import type { ResolveAccount } from "../../application/resolve-account.js";
import { account, session, user } from "../persistence/auth-schema.js";
import type { Database } from "../persistence/database.js";
import {
  oauthLinkAttempt,
  providerCredential,
} from "../persistence/provider-credentials-schema.js";
import { appleClientSecret } from "./apple-client-secret.js";
import { nativeAppleProof } from "./apple-proof-context.js";
import {
  authRequestLanguage,
  setVerifiedProviderIdentity,
} from "./auth-request-scope.js";
import { identityFingerprint } from "./identity-fingerprint.js";
import { createTokenVault } from "./token-vault.js";
import type { AppleRevocationCredential } from "./token-vault.js";

const stateContextSchema = z.object({ gloupsLinkAttemptId: z.uuid() });

export const createProviderCredentials = ({
  config,
  db,
  resolve,
  sensitive,
}: {
  config: ApiConfig;
  db: Database;
  resolve: ResolveAccount;
  sensitive: AuthorizeSensitiveChange;
}) => {
  const vault = createTokenVault(config.tokenKeyring);

  const linkActor = async () => {
    const nativeActorId = nativeAppleProof()?.actorAuthUserId;
    const state = await getOAuthState();
    const context = stateContextSchema.safeParse(state?.serverContext);

    if (!nativeActorId && !context.success) {
      if (state?.link) {
        throw new APIError("FORBIDDEN", {
          code: "LINK_PROOF_REQUIRED",
          message: "Start linking again after signing in.",
        });
      }

      return null;
    }

    let actorId = nativeActorId;
    let sessionId: string | null = nativeAppleProof()?.actorSessionId ?? null;

    if (context.success) {
      const [attempt] = await db
        .select()
        .from(oauthLinkAttempt)
        .where(
          and(
            eq(oauthLinkAttempt.id, context.data.gloupsLinkAttemptId),
            gt(oauthLinkAttempt.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!attempt) {
        throw new APIError("FORBIDDEN", {
          code: "FRESH_AUTH_REQUIRED",
          message: "Sign in again before linking.",
        });
      }

      ({ authUserId: actorId, sessionId } = attempt);
    }

    const [row] = await db
      .select({ identity: user, proof: session })
      .from(session)
      .innerJoin(user, eq(user.id, session.userId))
      .where(
        and(
          eq(session.userId, actorId ?? ""),
          gt(session.expiresAt, new Date()),
          ...(sessionId ? [eq(session.id, sessionId)] : [])
        )
      )
      .orderBy(session.createdAt)
      .limit(1);

    if (!row) {
      throw new APIError("UNAUTHORIZED", {
        code: "AUTH_REQUIRED",
        message: "Sign in again.",
      });
    }

    const identity = {
      authUserId: row.identity.id,
      authenticatedAtMs: row.proof.createdAt.getTime(),
      email: row.identity.email,
      emailVerified: row.identity.emailVerified,
      name: row.identity.name,
      sessionId: row.proof.id,
    };

    await resolve.execute(identity);
    await sensitive.execute(identity);

    return row.identity;
  };

  const preserveProfile = async (
    providerId: "apple" | "google",
    subject: string,
    incomingEmail?: string
  ) => {
    setVerifiedProviderIdentity(
      identityFingerprint(config, "subject", `${providerId}:${subject}`)
    );
    const actor = await linkActor();

    const [existing] = await db
      .select({
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
      })
      .from(account)
      .innerJoin(user, eq(user.id, account.userId))
      .where(
        and(eq(account.providerId, providerId), eq(account.accountId, subject))
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    if (actor) {
      return {
        email: actor.email,
        emailVerified: actor.emailVerified,
        name: actor.name,
      };
    }

    if (!incomingEmail) {
      throw new APIError("BAD_REQUEST", {
        code: "APPLE_EMAIL_REQUIRED",
        message: "Sign in with an existing method, then link Apple.",
      });
    }

    const oauth = await getOAuthState();

    const language = z
      .object({ gloupsLanguage: z.enum(["en", "fr"]) })
      .safeParse(oauth?.serverContext);

    return {
      preferredLanguage: language.success
        ? language.data.gloupsLanguage
        : authRequestLanguage(),
    };
  };

  const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

  if (config.apple) {
    socialProviders.apple = async () => {
      const { apple } = config;

      if (!apple) {
        throw new Error("Apple is unavailable.");
      }

      return {
        audience: [apple.serviceId, apple.bundleId],
        clientId: apple.serviceId,
        clientSecret: await appleClientSecret(apple, apple.serviceId),
        mapProfileToUser: (profile) =>
          preserveProfile("apple", profile.sub, profile.email),
        scope: ["name", "email"],
      };
    };
  }

  if (config.google) {
    socialProviders.google = {
      ...config.google,
      mapProfileToUser: (profile) =>
        preserveProfile("google", profile.sub, profile.email),
      scope: ["openid", "email", "profile"],
    };
  }

  return {
    async bind(id: string, authUserId: string) {
      await db.transaction(async (transaction) => {
        const [intent] = await transaction
          .select()
          .from(providerCredential)
          .where(eq(providerCredential.id, id))
          .for("update")
          .limit(1);

        if (
          !intent ||
          (intent.expectedActorId && intent.expectedActorId !== authUserId)
        ) {
          throw new Error("Apple credential binding failed.");
        }

        const [linked] = await transaction
          .select({ id: account.id })
          .from(account)
          .where(
            and(
              eq(account.userId, authUserId),
              eq(account.providerId, "apple"),
              eq(account.accountId, intent.appleSubject)
            )
          )
          .limit(1);

        if (!linked) {
          throw new Error("Apple subject binding is missing.");
        }

        await transaction
          .update(providerCredential)
          .set({ authUserId, expectedActorId: null, phase: "bound" })
          .where(eq(providerCredential.id, id));
      });
    },
    async prepare(
      credential: AppleRevocationCredential,
      expectedActorId: string | null
    ) {
      const id = randomUUID();
      const now = new Date();
      await db.insert(providerCredential).values({
        appleSubject: credential.subject,
        authUserId: null,
        ciphertext: await vault.seal(credential),
        clientId: credential.clientId,
        createdAt: now,
        expectedActorId,
        id,
        phase: "prepared",
        retryAt: new Date(now.getTime() + 300_000),
      });

      return id;
    },
    async reconcile(id: string) {
      await db
        .update(providerCredential)
        .set({ phase: "reconcile", retryAt: new Date() })
        .where(
          and(
            eq(providerCredential.id, id),
            eq(providerCredential.phase, "prepared")
          )
        );
    },
    socialProviders,
  };
};

export type ProviderCredentials = ReturnType<typeof createProviderCredentials>;
