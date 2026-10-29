import { z } from "zod";

import type { AuthClient } from "./auth-client";
import { responseFailure } from "./errors";
import { apiOrigin, expoOrigin } from "./runtime";

const accountSchema = z
  .object({
    account: z.object({ id: z.uuid() }).strict(),
    user: z
      .object({
        email: z.email(),
        emailVerified: z.boolean(),
        name: z.string(),
      })
      .strict(),
  })
  .strict();

export type AccountView = z.infer<typeof accountSchema>;

export const createAccountAPI = (
  client: AuthClient,
  guardedFetch: typeof fetch
) => ({
  async fetchAccount(signal?: AbortSignal): Promise<AccountView> {
    const cookie = await client.getCookie();

    const response = await guardedFetch(`${apiOrigin}/api/me`, {
      credentials: "omit",
      headers: { cookie, "expo-origin": expoOrigin },
      signal,
    });

    if (!response.ok) {
      throw await responseFailure(response);
    }

    return accountSchema.parse(await response.json());
  },
});
