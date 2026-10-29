import { AsyncLocalStorage } from "node:async_hooks";

import { addOAuthServerContext } from "better-auth/api";
import { z } from "zod";

import { nativeAppleProof } from "./apple-proof-context.js";

const deliveryScope = new AsyncLocalStorage<{
  language?: "en" | "fr";
  pending: (() => Promise<void>)[];
  providerFingerprint?: string;
}>();

export const captureAuthLanguage = async (
  path: string,
  headers: Headers | undefined
): Promise<void> => {
  const language = z
    .enum(["en", "fr"])
    .catch("en")
    .parse(headers?.get("accept-language"));

  const scope = deliveryScope.getStore();

  if (scope) {
    scope.language = language;
  }

  if (path === "/sign-in/social" && !nativeAppleProof()) {
    await addOAuthServerContext({ gloupsLanguage: language });
  }
};

export const authRequestLanguage = (): "en" | "fr" =>
  deliveryScope.getStore()?.language ?? "en";

export const setVerifiedProviderIdentity = (fingerprint: string): void => {
  const scope = deliveryScope.getStore();

  if (!scope) {
    throw new Error("Provider identity requires the server request scope.");
  }

  scope.providerFingerprint = fingerprint;
};

export const queueAuthEmail = (deliver: () => Promise<void>): Promise<void> => {
  const scope = deliveryScope.getStore();

  if (!scope) {
    throw new Error("Auth email delivery requires the server request scope.");
  }

  scope.pending.push(deliver);

  return Promise.resolve();
};

export const runAuthRequest = (
  path: string,
  handle: () => Promise<Response>
): Promise<Response> =>
  deliveryScope.run({ pending: [] }, async () => {
    const response = await handle();

    if (response.status >= 400) {
      return response;
    }

    const scope = deliveryScope.getStore();

    if (!scope) {
      throw new Error("Auth request scope is missing.");
    }

    try {
      // Signup commits its auth transaction before this ledger/email handoff.
      await Promise.all(scope.pending.map((deliver) => deliver()));
    } catch {
      process.stderr.write("Auth email delivery unavailable.\n");

      // Reset requests preserve the SDK's generic account-independent response.
      if (path !== "/api/auth/request-password-reset") {
        return Response.json(
          {
            code: "EMAIL_DELIVERY_UNAVAILABLE",
            message: "Email delivery unavailable. Please retry.",
          },
          { status: 503 }
        );
      }
    }

    return response;
  });

export const verifiedProviderFingerprint = (): string | undefined =>
  deliveryScope.getStore()?.providerFingerprint;
