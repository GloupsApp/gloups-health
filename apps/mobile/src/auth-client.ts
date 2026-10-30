import { expoClient, storageAdapter } from "@better-auth/expo/client";
import { createAccountClient } from "@gloups/contracts/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

if (!configuredUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is required");
}

const parsedUrl = new URL(configuredUrl);

if (parsedUrl.protocol !== "https:" && !__DEV__) {
  throw new Error("The API requires HTTPS in release builds");
}

export const apiUrl = parsedUrl.origin;
const storagePrefix = __DEV__ ? "gloups.development" : "gloups.production";
const storage = storageAdapter(SecureStore);
let sessionEpoch = 0;

// A response from a retired account must not write cookies through the SDK's success hook.
const sessionFetch = async (
  input: string | URL | Request,
  init?: RequestInit
) => {
  const epoch = sessionEpoch;
  const response = await fetch(input instanceof URL ? input.href : input, init);

  if (epoch !== sessionEpoch) {
    return new Response(
      // oxlint-disable-next-line unicorn/prefer-response-static-json -- React Native's fetch polyfill does not implement Response.json().
      JSON.stringify({
        code: "SESSION_RETIRED",
        message: "Please sign in again",
      }),
      {
        headers: { "content-type": "application/json" },
        status: 401,
      }
    );
  }

  return response;
};

export const authClient = createAuthClient({
  baseURL: apiUrl,
  fetchOptions: { credentials: "omit", customFetchImpl: sessionFetch },
  plugins: [
    expoClient({
      cookiePrefix: "gloups",
      disableCache: true,
      scheme: "gloups-health",
      storage: SecureStore,
      storagePrefix,
    }),
  ],
});

export const accountClient = createAccountClient(apiUrl, () =>
  authClient.getCookie()
);

export const signOut = async () => {
  sessionEpoch += 1;

  try {
    const result = await authClient.signOut();

    return result.error === null;
  } catch {
    return false;
  } finally {
    await storage.setItemAsync(`${storagePrefix}_cookie`, "{}");
    await storage.setItemAsync(`${storagePrefix}_session_data`, "{}");
  }
};
