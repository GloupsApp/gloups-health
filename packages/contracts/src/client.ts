import { apiErrorSchema } from "@contracts/index";

import { createClient } from "../generated/dist/client/index";
import { getCurrentAccount } from "../generated/dist/sdk.gen";

export class AccountApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "AccountApiError";
    this.code = code;
    this.status = status;
  }
}

/** Cookies come from Better Auth's Expo client, never the platform cookie jar. */
export const createAccountClient = (
  baseUrl: string,
  cookie: () => Promise<string>
) => {
  const client = createClient({ baseUrl, credentials: "omit" });

  return {
    async current(signal?: AbortSignal) {
      const result = await getCurrentAccount({
        client,
        headers: { Cookie: await cookie() },
        signal: signal ?? null,
      });

      if (result.error !== undefined) {
        const error = apiErrorSchema.parse(result.error);
        throw new AccountApiError(
          error.error.code,
          result.response?.status ?? 503
        );
      }

      if (!result.data) {
        throw new Error("Invalid account response");
      }

      return result.data;
    },
  };
};
