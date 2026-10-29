import * as Apple from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { z } from "zod";

import { AuthFailureError, sdkFailure } from "./errors";
import { apiOrigin, storagePrefix } from "./runtime";
import type { SessionGeneration } from "./session-generation";

const challengeSchema = z.object({
  challengeId: z.uuid(),
  expiresAt: z.iso.datetime(),
});

const methodsSchema = z.array(
  z.object({ accountId: z.string(), providerId: z.string() })
);

const subjectKey = `${storagePrefix}_native-apple-subject`;

export const completeNativeApple = async (
  generation: SessionGeneration,
  purpose: "sign-in" | "link"
): Promise<void> => {
  if (!(await Apple.isAvailableAsync())) {
    throw new AuthFailureError("unavailable");
  }

  const bytes = await Crypto.getRandomBytesAsync(32);

  const nonce = [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

  const nonceHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  const issued = await generation.client.$fetch(
    `${apiOrigin}/api/identity/apple/challenges`,
    { body: { nonceHash, purpose }, method: "POST" }
  );

  if (issued.error) {
    throw sdkFailure(issued.error);
  }

  const challenge = challengeSchema.parse(issued.data);

  try {
    const credential = await Apple.signInAsync({
      nonce: nonceHash,
      requestedScopes: [
        Apple.AppleAuthenticationScope.FULL_NAME,
        Apple.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.authorizationCode) {
      throw new AuthFailureError("apple-unconfirmed");
    }

    const result = await generation.client.$fetch(
      `${apiOrigin}/api/identity/apple/native`,
      {
        body: {
          challengeId: challenge.challengeId,
          code: credential.authorizationCode,
          nonce,
          profile: {
            familyName: credential.fullName?.familyName ?? null,
            givenName: credential.fullName?.givenName ?? null,
          },
        },
        method: "POST",
      }
    );

    if (result.error) {
      throw sdkFailure(result.error);
    }

    if (purpose === "sign-in") {
      generation.acceptPrincipal(
        z
          .object({ user: z.object({ email: z.email(), id: z.string() }) })
          .parse(result.data).user
      );
    }

    const accounts = await generation.client.listAccounts();

    if (accounts.error) {
      throw sdkFailure(accounts.error);
    }

    const matches = methodsSchema
      .parse(accounts.data)
      .some(
        (method) =>
          method.providerId === "apple" && method.accountId === credential.user
      );

    if (!matches) {
      throw new AuthFailureError("apple-unconfirmed");
    }

    await generation.secure.storage.setItemAsync(subjectKey, credential.user);
  } catch (error) {
    const cancelled = z
      .object({ code: z.literal("ERR_REQUEST_CANCELED") })
      .safeParse(error);

    if (cancelled.success) {
      throw new AuthFailureError("cancelled");
    }

    throw error instanceof AuthFailureError
      ? error
      : new AuthFailureError("unavailable");
  }
};

export const nativeAppleRevoked = async (
  generation: SessionGeneration
): Promise<boolean> => {
  if (process.env.EXPO_OS !== "ios") {
    return false;
  }

  const subject = await generation.secure.storage.getItemAsync(subjectKey);

  if (!subject) {
    return false;
  }

  const state = await Apple.getCredentialStateAsync(subject);

  return [
    Apple.AppleAuthenticationCredentialState.REVOKED,
    Apple.AppleAuthenticationCredentialState.NOT_FOUND,
  ].includes(state);
};
