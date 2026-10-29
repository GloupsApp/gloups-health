import { expoClient } from "@better-auth/expo/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { apiOrigin, authScheme, cookiePrefix, storagePrefix } from "./runtime";
import type { SessionStorage } from "./secure-session-store";

export const createAuthClientForSession = (
  storage: SessionStorage,
  guardedFetch: typeof fetch
) =>
  createAuthClient({
    baseURL: apiOrigin,
    fetchOptions: {
      credentials: "omit",
      customFetchImpl: (input, init) =>
        guardedFetch(input instanceof URL ? input.href : input, init),
      retry: 0,
    },
    plugins: [
      expoClient({
        cookiePrefix,
        disableCache: true,
        scheme: authScheme,
        storage: storage.storage,
        storagePrefix,
      }),
      inferAdditionalFields({
        user: {
          preferredLanguage: {
            defaultValue: "en",
            input: true,
            required: true,
            type: ["en", "fr"],
          },
        },
      }),
    ],
  });

export type AuthClient = ReturnType<typeof createAuthClientForSession>;
