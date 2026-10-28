import { createHash } from "node:crypto";

import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import type { AuthorizeSensitiveChange } from "../../application/authorize-sensitive-change.js";
import type { IdentitySessions } from "../../application/ports.js";
import type { ResolveAccount } from "../../application/resolve-account.js";
import { AccessFailureError } from "../../application/types.js";
import { createAppleChallenges } from "../persistence/apple-challenges.js";
import { session } from "../persistence/auth-schema.js";
import type { Database } from "../persistence/database.js";
import { withNativeAppleProof } from "./apple-proof-context.js";
import type { Auth } from "./auth.js";
import { runAuthRequest } from "./lifecycle-hooks.js";
import { appleClientSecret } from "./provider-credentials.js";
import type { ProviderCredentials } from "./provider-credentials.js";

export const APPLE_NATIVE = Symbol("APPLE_NATIVE");

const appleKeys = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

export const appleChallengeInput = z
  .object({
    nonceHash: z.string().regex(/^[a-f0-9]{64}$/u),
    purpose: z.enum(["sign-in", "link"]),
  })
  .strict();

export const nativeAppleInput = z
  .object({
    challengeId: z.uuid(),
    code: z.string().min(1).max(4096),
    nonce: z.string().min(32).max(256),
    profile: z
      .object({
        familyName: z.string().max(256).nullable(),
        givenName: z.string().max(256).nullable(),
      })
      .strict()
      .optional(),
  })
  .strict();

const exchangeSchema = z.object({
  id_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

const nativeClaimsSchema = z.object({
  nonce: z.string().min(1),
  sub: z.string().min(1),
});

const resultSchema = z.object({ user: z.object({ id: z.string().min(1) }) });

interface NativeAppleIdToken {
  nonce: string;
  token: string;
  user?: { name: { firstName: string; lastName: string } };
}

const toAppleIdToken = (
  input: z.infer<typeof nativeAppleInput>,
  token: string
): NativeAppleIdToken => {
  const result: NativeAppleIdToken = { nonce: input.nonce, token };

  if (input.profile) {
    result.user = {
      name: {
        firstName: input.profile.givenName ?? "",
        lastName: input.profile.familyName ?? "",
      },
    };
  }

  return result;
};

export const createNativeApple = ({
  auth,
  config,
  credentials,
  db,
  resolve,
  sensitive,
  sessions,
}: {
  auth: Auth;
  config: ApiConfig;
  credentials: ProviderCredentials;
  db: Database;
  resolve: ResolveAccount;
  sensitive: AuthorizeSensitiveChange;
  sessions: IdentitySessions;
}) => {
  const challenges = createAppleChallenges(db);

  const actor = async (headers: Headers) => {
    const identity = await sessions.verify(headers.get("cookie") ?? "");

    if (!identity) {
      throw new AccessFailureError("AUTH_REQUIRED");
    }

    await resolve.execute(identity);
    await sensitive.execute(identity);

    return identity;
  };

  return {
    async challenge(
      input: z.infer<typeof appleChallengeInput>,
      headers: Headers
    ) {
      if (!config.apple) {
        throw new ServiceUnavailableException();
      }

      const identity = input.purpose === "link" ? await actor(headers) : null;

      return challenges.issue(
        input.purpose,
        input.nonceHash,
        identity?.authUserId ?? null
      );
    },
    async complete(
      input: z.infer<typeof nativeAppleInput>,
      headers: Headers
    ): Promise<Response> {
      const { apple } = config;

      if (!apple) {
        throw new ServiceUnavailableException();
      }

      const pending = await challenges.find(input.challengeId);

      if (!pending) {
        throw new BadRequestException();
      }

      const identity = pending.purpose === "link" ? await actor(headers) : null;
      const nonceHash = createHash("sha256").update(input.nonce).digest("hex");

      const challenge = await challenges.consume(
        input.challengeId,
        nonceHash,
        identity?.authUserId ?? null
      );

      if (!challenge) {
        throw new BadRequestException();
      }

      const exchange = await fetch("https://appleid.apple.com/auth/token", {
        body: new URLSearchParams({
          client_id: apple.bundleId,
          client_secret: await appleClientSecret(apple, apple.bundleId),
          code: input.code,
          grant_type: "authorization_code",
        }),
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
        signal: AbortSignal.timeout(10_000),
      });

      if (!exchange.ok) {
        throw new BadRequestException();
      }

      const tokens = exchangeSchema.parse(await exchange.json());

      const verified = await jwtVerify(tokens.id_token, appleKeys, {
        algorithms: ["RS256"],
        audience: apple.bundleId,
        issuer: "https://appleid.apple.com",
        maxTokenAge: "10m",
      });

      const claims = nativeClaimsSchema.parse(verified.payload);

      if (claims.nonce !== nonceHash) {
        throw new BadRequestException();
      }

      const intentId = await credentials.prepare(
        {
          clientId: apple.bundleId,
          refreshToken: tokens.refresh_token,
          subject: claims.sub,
        },
        identity?.authUserId ?? null
      );

      const idToken = toAppleIdToken(input, tokens.id_token);

      try {
        const response = await withNativeAppleProof(
          {
            actorAuthUserId: identity?.authUserId ?? null,
            actorSessionId: identity?.sessionId ?? null,
            intentId,
          },
          () =>
            runAuthRequest("/api/auth/sign-in/social", () =>
              identity
                ? auth.api.linkSocialAccount({
                    asResponse: true,
                    body: {
                      idToken: { nonce: input.nonce, token: tokens.id_token },
                      provider: "apple",
                    },
                    headers,
                  })
                : auth.api.signInSocial({
                    asResponse: true,
                    body: {
                      idToken,
                      provider: "apple",
                    },
                    headers,
                  })
            )
        );

        if (!response.ok) {
          throw new Error("Apple setup was not confirmed.");
        }

        const authUserId =
          identity?.authUserId ??
          resultSchema.parse(await response.clone().json()).user.id;

        await credentials.bind(intentId, authUserId);

        return response;
      } catch {
        // Prepared intent survives an unavailable database and is reconciled by the worker.
        await Promise.allSettled([
          credentials.reconcile(intentId),
          db.delete(session).where(and(eq(session.nativeSetupId, intentId))),
        ]);

        return Response.json(
          {
            code: "APPLE_SETUP_UNCONFIRMED",
            message: "Sign in again to check the result.",
          },
          { status: 503 }
        );
      }
    },
  };
};

export type NativeApple = ReturnType<typeof createNativeApple>;
