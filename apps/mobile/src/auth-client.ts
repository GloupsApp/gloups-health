import {
  expoClient,
  getSetCookie,
  storageAdapter,
} from "@better-auth/expo/client";
import { createAccountClient } from "@gloups/contracts/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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
let retiringSession = false;
const responseEpochs = new WeakMap<Response, number>();

// A response from a retired account must not write cookies through the SDK's success hook.
const sessionFetch = async (
  input: string | URL | Request,
  init?: RequestInit
) => {
  const epoch = sessionEpoch;
  const response = await fetch(input instanceof URL ? input.href : input, init);
  responseEpochs.set(response, epoch);

  if (
    epoch !== sessionEpoch ||
    (retiringSession && !response.url.endsWith("/sign-out"))
  ) {
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
        request.signal?.aborted ||
        (retiringSession && !request.url.toString().endsWith("/sign-out"))
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

export type SocialProvider = "apple" | "google";

const providerProxyUrl = async (authorizationURL: string) => {
  const parameters = new URLSearchParams({
    authorizationURL,
  });

  const storedCookie = await authClient.getCookie();

  const cookies = storedCookie.split("; ");

  const oauthState = cookies.find((cookie) =>
    /^(?:__Secure-)?gloups\.oauth_state=/u.test(cookie)
  );

  if (oauthState) {
    parameters.set("oauthState", oauthState.slice(oauthState.indexOf("=") + 1));
  }

  return `${apiUrl}/api/auth/expo-authorization-proxy?${parameters.toString()}`;
};

const openAuthBrowser = async (url: string, callbackURL: string) => {
  const Browser = await import("expo-web-browser");

  if (Platform.OS === "android") {
    try {
      Browser.dismissAuthSession();
    } catch {
      // The previous Custom Tab may already be closed, as in Expo's SDK hook.
    }
  }

  return Browser.openAuthSessionAsync(url, callbackURL);
};

export const completeProviderAuth = async (
  provider: SocialProvider,
  linking = false
) => {
  const epoch = sessionEpoch;

  const Crypto = await import("expo-crypto");

  const callbackURL = `gloups-health://auth-complete/${Crypto.randomUUID()}`;

  const input = {
    callbackURL,
    disableRedirect: true,
    errorCallbackURL: callbackURL,
    provider,
  };

  const started = linking
    ? await authClient.linkSocial(input)
    : await authClient.signIn.social(input);

  if (started.error) {
    return { completed: false, error: started.error };
  }

  if (!started.data.url || epoch !== sessionEpoch) {
    return { completed: false, error: { code: "SESSION_RETIRED" } };
  }

  // Use the Expo server's state-cookie bridge, while retaining the native
  // result so cancellation and provider errors can be shown to the person.
  const result = await openAuthBrowser(
    await providerProxyUrl(started.data.url),
    callbackURL
  );

  if (result.type !== "success") {
    return { completed: false, error: { code: "PROVIDER_CANCELLED" } };
  }

  const returned = new URL(result.url);
  const expected = new URL(callbackURL);

  if (
    returned.protocol !== expected.protocol ||
    returned.hostname !== expected.hostname ||
    returned.pathname !== expected.pathname ||
    epoch !== sessionEpoch
  ) {
    return { completed: false, error: { code: "SESSION_RETIRED" } };
  }

  const error = returned.searchParams.get("error");

  if (error) {
    return { completed: false, error: { code: error.toUpperCase() } };
  }

  const cookie = returned.searchParams.get("cookie");

  if (!linking && !cookie) {
    return { completed: false, error: { code: "PROVIDER_FAILED" } };
  }

  if (cookie) {
    const current = await storage.getItemAsync(`${storagePrefix}_cookie`);

    if (epoch === sessionEpoch) {
      await storage.setItemAsync(
        `${storagePrefix}_cookie`,
        getSetCookie(cookie, current ?? undefined)
      );
    }
  }

  if (epoch !== sessionEpoch) {
    return { completed: false, error: { code: "SESSION_RETIRED" } };
  }

  const session = await authClient.getSession();

  return session.data && !session.error
    ? { completed: true, error: null }
    : { completed: false, error: { code: "PROVIDER_FAILED" } };
};

export const signOut = async () => {
  retiringSession = true;
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
  sessionEpoch += 1;
  retiringSession = false;

  // The SDK adapter logs native write failures instead of rejecting them.
  // Do not report local sign-out while usable credentials remain persisted.
  if (await authClient.getCookie()) {
    throw new Error("Local credentials could not be cleared");
  }

  return confirmed;
};
