import { mock, spyOn, test } from "bun:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const appRequire = createRequire(import.meta.url);

const sdkRequire = createRequire(
  appRequire.resolve("@better-auth/expo/client")
);

const mockNativeModule = <Exports extends object>(
  name: string,
  factory: () => Exports
) => {
  // Bun may install separate peer instances of Expo modules for the SDK.
  for (const path of new Set([
    appRequire.resolve(name),
    sdkRequire.resolve(name),
  ])) {
    mock.module(path, factory);
  }
};

const values = new Map<string, string>();
let failWrites = false;

let browserMode:
  | "success"
  | "cancel"
  | "provider-error"
  | "wrong-callback"
  | "held" = "success";

let browserRelease = Promise.withResolvers<undefined>();
let browserOpened = Promise.withResolvers<undefined>();
let requireSessionCookie = false;

mockNativeModule("expo-crypto", () => ({ randomUUID: () => "synthetic-flow" }));

mockNativeModule("expo-web-browser", () => ({
  openAuthSessionAsync: async (url: string, callbackURL: string) => {
    assert.ok(url.includes("/api/auth/expo-authorization-proxy?"));
    assert.ok(callbackURL.startsWith("gloups-health://auth-complete/"));
    browserOpened.resolve(undefined);

    if (browserMode === "held") {
      await browserRelease.promise;
    }

    if (browserMode === "cancel") {
      return { type: "cancel" };
    }

    const returned = new URL(
      browserMode === "wrong-callback"
        ? "gloups-health://auth-complete/another-flow"
        : callbackURL
    );

    returned.searchParams.set(
      "cookie",
      "gloups.session_token=browser-session; Max-Age=604800; Path=/"
    );

    if (browserMode === "provider-error") {
      returned.searchParams.set("error", "account_not_linked");
    }

    return { type: "success", url: returned.toString() };
  },
}));

mockNativeModule("react-native", () => ({
  AppState: { addEventListener: () => ({ remove: () => {} }) },
  Platform: { OS: "ios" },
}));

mockNativeModule("expo-constants", () => ({
  default: { expoConfig: { scheme: "gloups-health" } },
}));

mockNativeModule("expo-linking", () => ({
  createURL: (path: string) => `gloups-health://${path}`,
}));

mockNativeModule("expo-network", () => ({
  addNetworkStateListener: () => ({ remove: () => {} }),
}));

mockNativeModule("expo-secure-store", () => ({
  getItem: (key: string) => values.get(key) ?? null,
  getItemAsync: (key: string) => Promise.resolve(values.get(key) ?? null),
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
  setItemAsync: (key: string, value: string) => {
    if (failWrites) {
      return Promise.reject(new Error("Synthetic native storage failure"));
    }

    values.set(key, value);

    return Promise.resolve();
  },
}));

Object.defineProperty(globalThis, "__DEV__", {
  configurable: true,
  value: true,
});

interface NativeReader {
  result: string | null;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  readAsText: (blob: Blob) => void;
}

interface NativeXhr {
  readyState: number;
  response: Blob | null;
  responseType: string;
  responseURL: string;
  status: number;
  statusText: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  onreadystatechange: (() => void) | null;
  open: (method: string, url: string) => void;
  setRequestHeader: (name: string, value: string) => void;
  getAllResponseHeaders: () => string;
  send: () => void;
  abort: () => void;
}

let holdNextRead = false;
let remoteSignOutSucceeds = false;
let sessionToken = "stale";
let xhrAborts = 0;
let delayedRead = Promise.withResolvers<() => Promise<void>>();

// Model the native I/O boundary only; the real installed fetch, Response,
// Better Auth client, Expo cookie hook and managed storage remain in use.
const NativeFileReader = function NativeFileReader() {
  const reader: NativeReader = {
    onerror: null,
    onload: null,
    readAsText: (blob) => {
      const finish = async () => {
        reader.result = await blob.text();
        reader.onload?.();
      };

      if (holdNextRead) {
        holdNextRead = false;
        delayedRead.resolve(finish);
      } else {
        void finish();
      }
    },
    result: null,
  };

  return reader;
};

const nativeResponse = (url: string, token: string, cookie: string) => {
  if (/\/(?:sign-in\/social|link-social)$/u.test(url)) {
    return {
      redirect: false,
      url: "https://provider.example.test/authorize?state=synthetic-state",
    };
  }

  if (url.endsWith("/sign-out")) {
    return { success: true };
  }

  if (requireSessionCookie && !cookie) {
    return null;
  }

  return {
    session: { expiresAt: "2030-01-01T00:00:00Z", id: "session", token },
    user: {
      email: "native@example.test",
      emailVerified: true,
      id: "user",
      name: "Synthetic",
    },
  };
};

const NativeXMLHttpRequest = function NativeXMLHttpRequest() {
  const token = sessionToken;
  let requestCookie = "";

  const xhr: NativeXhr = {
    abort: () => {
      xhrAborts += 1;
      xhr.onabort?.();
    },
    getAllResponseHeaders: () =>
      `content-type: application/json\r\n${/\/(?:sign-in\/social|link-social)$/u.test(xhr.responseURL) || (requireSessionCookie && !requestCookie) ? "" : `set-cookie: gloups.session_token=${token}; Max-Age=604800; Path=/\r\n`}`,
    onabort: null,
    onerror: null,
    onload: null,
    onreadystatechange: null,
    open: (_method, url) => {
      xhr.responseURL = url;
    },
    readyState: 0,
    response: null,
    responseType: "",
    responseURL: "",
    send: () => {
      xhr.readyState = 4;
      xhr.onreadystatechange?.();
      const signingOut = xhr.responseURL.endsWith("/sign-out");

      if (signingOut && !remoteSignOutSucceeds) {
        xhr.onerror?.();

        return;
      }

      xhr.response = new Blob(
        [JSON.stringify(nativeResponse(xhr.responseURL, token, requestCookie))],
        { type: "application/json" }
      );
      xhr.onload?.();
    },
    setRequestHeader: (name, value) => {
      if (name.toLowerCase() === "cookie") {
        requestCookie = value;
      }
    },
    status: 200,
    statusText: "OK",
  };

  return xhr;
};

Object.defineProperty(globalThis, "FileReader", {
  configurable: true,
  value: NativeFileReader,
});

Object.defineProperty(globalThis, "XMLHttpRequest", {
  configurable: true,
  value: NativeXMLHttpRequest,
});

const nativeFetch = await import("whatwg-fetch");

Object.assign(globalThis, {
  Headers: nativeFetch.Headers,
  Request: nativeFetch.Request,
  Response: nativeFetch.Response,
  fetch: nativeFetch.fetch,
});

const { authClient, completeProviderAuth, signOut } =
  await import("@mobile/auth-client");

test.each([true, false])(
  "late native response cannot restore cookies after sign-out (remote confirmed: %s)",
  async (remoteConfirmed) => {
    remoteSignOutSucceeds = remoteConfirmed;
    sessionToken = "stale";
    holdNextRead = true;
    xhrAborts = 0;
    delayedRead = Promise.withResolvers<() => Promise<void>>();
    const controller = new AbortController();

    const request = authClient.getSession({
      fetchOptions: { signal: controller.signal },
    });

    const completed = request.then(
      (result) => result.data,
      () => null
    );

    const finishRead = await delayedRead.promise;

    // This is the same cancellation the hook performs on background/sign-out.
    // XHR is already complete, so its signal cannot cancel the FileReader.
    controller.abort();
    assert.equal(xhrAborts, 0);
    assert.equal(await signOut(), remoteConfirmed);
    assert.equal(await authClient.getCookie(), "");
    await finishRead();
    assert.equal(await completed, null);
    assert.equal(await authClient.getCookie(), "");

    sessionToken = "current";
    const current = await authClient.getSession();
    assert.equal(current.error, null);
    assert.equal(await authClient.getCookie(), "gloups.session_token=current");
    await signOut();
  }
);

test("a native storage failure cannot be reported as successful local sign-out", async () => {
  remoteSignOutSucceeds = false;
  sessionToken = "current";
  await authClient.getSession();
  assert.equal(await authClient.getCookie(), "gloups.session_token=current");

  const errors = spyOn(console, "error").mockImplementation(() => {});
  failWrites = true;

  try {
    await assert.rejects(signOut(), /Local credentials could not be cleared/u);
  } finally {
    failWrites = false;
    errors.mockRestore();
    await signOut();
  }

  assert.equal(await authClient.getCookie(), "");
});

test.each(["apple", "google"] as const)(
  "%s browser completion establishes an API session through managed native storage",
  async (provider) => {
    requireSessionCookie = true;
    failWrites = false;
    remoteSignOutSucceeds = true;
    await signOut();
    browserMode = "success";
    sessionToken = "browser-session";
    const result = await completeProviderAuth(provider);
    assert.equal(result.completed, true);
    assert.equal(
      await authClient.getCookie(),
      "gloups.session_token=browser-session"
    );
    await signOut();
  }
);

test.each(["cancel", "provider-error", "wrong-callback"] as const)(
  "native %s keeps the person signed out and offers a retry",
  async (mode) => {
    await signOut();
    browserMode = mode;
    const result = await completeProviderAuth("google");
    assert.equal(result.completed, false);
    assert.equal(await authClient.getCookie(), "");
  }
);

test("a browser completion after sign-out cannot restore a retired account", async () => {
  await signOut();
  browserMode = "held";
  browserOpened = Promise.withResolvers<undefined>();
  browserRelease = Promise.withResolvers<undefined>();
  const pending = completeProviderAuth("apple");
  await browserOpened.promise;
  await signOut();
  browserRelease.resolve(undefined);
  const result = await pending;
  assert.equal(result.completed, false);
  assert.equal(await authClient.getCookie(), "");
});
