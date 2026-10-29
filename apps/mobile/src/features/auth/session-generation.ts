import { z } from "zod";

import type { AccountView } from "./api-client";
import { createAccountAPI } from "./api-client";
import { createAuthClientForSession } from "./auth-client";
import { AuthFailureError } from "./errors";
import { preferredLanguage } from "./preferred-language";
import { createSessionStorage } from "./secure-session-store";

export const createSessionGeneration = async () => {
  const secure = await createSessionStorage();
  const requests = new Set<AbortController>();
  let active = true;
  let principal: { id: string; email: string } | null = null;
  let accountId: string | null = null;
  let retirement: Promise<string> | null = null;

  const guardedFetch: typeof fetch = async (input, options) => {
    secure.assertActive();

    if (!active) {
      throw new AuthFailureError("stale");
    }

    const request = new AbortController();
    const deadline = setTimeout(() => request.abort(), 10_000);
    const cancel = () => request.abort();

    if (options?.signal?.aborted) {
      request.abort();
    }

    options?.signal?.addEventListener("abort", cancel, { once: true });
    requests.add(request);

    try {
      const headers = new Headers(options?.headers);
      headers.set("accept-language", preferredLanguage());

      const response = await fetch(input, {
        ...options,
        headers,
        signal: request.signal,
      });

      if (!active) {
        throw new AuthFailureError("stale");
      }

      return response;
    } finally {
      clearTimeout(deadline);
      requests.delete(request);
      options?.signal?.removeEventListener("abort", cancel);
    }
  };

  const client = createAuthClientForSession(secure, guardedFetch);

  return {
    acceptAccount(view: AccountView): void {
      if (
        !principal ||
        view.user.email !== principal.email ||
        !view.user.emailVerified ||
        (accountId && accountId !== view.account.id)
      ) {
        throw new AuthFailureError("identity-conflict");
      }

      accountId = view.account.id;
    },
    acceptPrincipal(user: { id: string; email: string }): void {
      const verified = z
        .object({ email: z.email(), id: z.string().min(1).max(256) })
        .parse(user);

      if (
        principal &&
        (principal.id !== verified.id || principal.email !== verified.email)
      ) {
        throw new AuthFailureError("identity-conflict");
      }

      principal = verified;
    },
    api: createAccountAPI(client, guardedFetch),
    client,
    isActive: () => active && secure.isActive(),
    retire(): Promise<string> {
      retirement ??= (async () => {
        let cookie = "";

        try {
          cookie = await client.getCookie();
        } finally {
          active = false;

          for (const request of requests) {
            request.abort();
          }

          await secure.retire();
        }

        return cookie;
      })();

      return retirement;
    },
    secure,
  };
};

export type SessionGeneration = Awaited<
  ReturnType<typeof createSessionGeneration>
>;
