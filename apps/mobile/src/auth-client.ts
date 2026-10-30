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
const responseEpochs = new WeakMap<Response, number>();

// A response from a retired account must not write cookies through the SDK's success hook.
const sessionFetch = async (
  input: string | URL | Request,
  init?: RequestInit
) => {
  const epoch = sessionEpoch;
  const response = await fetch(input instanceof URL ? input.href : input, init);
  responseEpochs.set(response, epoch);

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
  fetchOptions: {
    credentials: "omit",
    customFetchImpl: sessionFetch,
    onSuccess: ({ request, response }) => {
      // Native body parsing can outlive XHR cancellation. Better Auth runs this
      // lifecycle hook after parsing and before Expo persists response cookies.
      if (
        responseEpochs.get(response) !== sessionEpoch ||
        request.signal?.aborted
      ) {
        throw new Error("Session response retired");
      }
    },
  },
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
  let confirmed: boolean;

  try {
    const result = await authClient.signOut();
    confirmed = result.error === null;
  } catch {
    confirmed = false;
  }

  await storage.setItemAsync(`${storagePrefix}_cookie`, "{}");
  await storage.setItemAsync(`${storagePrefix}_session_data`, "{}");

  // The SDK adapter logs native write failures instead of rejecting them.
  // Do not report local sign-out while usable credentials remain persisted.
  if (await authClient.getCookie()) {
    throw new Error("Local credentials could not be cleared");
  }

  return confirmed;
};
