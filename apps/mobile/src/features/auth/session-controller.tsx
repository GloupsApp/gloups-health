import * as Network from "expo-network";
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { PropsWithChildren } from "react";
import { AppState } from "react-native";

import { requestDeletion } from "./account-lifecycle";
import type { DeletionReceipt } from "./account-lifecycle";
import type { AccountView } from "./api-client";
import {
  AuthFailureError,
  networkFailure,
  sdkFailure,
  oauthCallbackFailure,
} from "./errors";
import type { AuthFailureCode } from "./errors";
import type { Language } from "./language";
import { nativeAppleRevoked } from "./native-apple";
import { apiOrigin, authCallback, expoOrigin, resetCallback } from "./runtime";
import { createSessionGeneration } from "./session-generation";
import type { SessionGeneration } from "./session-generation";
import { createSocialSignIn } from "./social-sign-in";

export type SessionNotice =
  | "verification-returned"
  | "verified"
  | "password-updated"
  | "remote-unconfirmed"
  | "social-interrupted"
  | "deletion-unconfirmed";

export type SessionState =
  | { readonly kind: "loading" }
  | {
      readonly kind: "authenticated";
      readonly account: AccountView;
      readonly authNotice: AuthFailureCode | null;
    }
  | {
      readonly kind: "signed-out";
      readonly notice?: SessionNotice;
      readonly deletion?: DeletionReceipt;
    }
  | { readonly kind: "verification-required"; readonly email: string }
  | { readonly kind: "offline" }
  | { readonly kind: "unavailable"; readonly code: AuthFailureCode };

const remoteSignOut = async (cookie: string): Promise<boolean> => {
  if (!cookie) {
    return true;
  }

  const abort = new AbortController();
  const deadline = setTimeout(() => abort.abort(), 10_000);

  try {
    const response = await fetch(`${apiOrigin}/api/auth/sign-out`, {
      body: JSON.stringify({}),
      credentials: "omit",
      headers: {
        "content-type": "application/json",
        cookie,
        "expo-origin": expoOrigin,
      },
      method: "POST",
      signal: abort.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(deadline);
  }
};

const failure = (issue: { status: number; code?: string | undefined }) =>
  issue.status === 0 ? networkFailure() : Promise.resolve(sdkFailure(issue));

const failureCode = (state: SessionState): AuthFailureCode => {
  if (state.kind === "offline") {
    return "offline";
  }

  return state.kind === "unavailable" ? state.code : "unavailable";
};

const assertConnected = async (): Promise<void> => {
  const network = await Network.getNetworkStateAsync();

  if (network.isConnected === false || network.isInternetReachable === false) {
    throw new AuthFailureError("offline");
  }
};

const createSessionController = () => {
  let state: SessionState = { kind: "loading" };
  let active: SessionGeneration | null = null;
  let initialization: Promise<void> | null = null;
  let transition = Promise.resolve(true);
  let revision = 0;
  let ownedFlow: Promise<void> | null = null;
  let lastFlowFailure: AuthFailureCode | null = null;
  let verificationEmail: string | null = null;
  const listeners = new Set<() => void>();

  const publish = (next: SessionState) => {
    state = next;

    for (const listener of listeners) {
      listener();
    }
  };

  const current = (owner: SessionGeneration) =>
    active === owner && owner.isActive();

  const rotate = (activate: boolean): Promise<boolean> => {
    const operation = transition.then(async () => {
      revision += 1;
      publish({ kind: "loading" });
      const previous = active;
      active = null;
      let confirmed = true;

      if (previous) {
        const cookie = await previous.retire();
        confirmed = await remoteSignOut(cookie);
      }

      if (activate) {
        active = await createSessionGeneration();
      }

      return confirmed;
    });

    transition = operation.catch(() => {
      publish({ code: "unavailable", kind: "unavailable" });

      return false;
    });

    return operation;
  };

  const refreshOwner = async (owner: SessionGeneration): Promise<void> => {
    revision += 1;
    const requestRevision = revision;
    publish({ kind: "loading" });

    try {
      await assertConnected();

      const session = await owner.client.getSession({
        query: { disableCookieCache: true },
      });

      if (!current(owner) || requestRevision !== revision) {
        return;
      }

      if (session.error) {
        throw await failure(session.error);
      }

      if (!session.data) {
        publish(
          verificationEmail
            ? { email: verificationEmail, kind: "verification-required" }
            : { kind: "signed-out" }
        );

        return;
      }

      if (!session.data.user.emailVerified) {
        publish({
          email: session.data.user.email,
          kind: "verification-required",
        });

        return;
      }

      owner.acceptPrincipal(session.data.user);
      const revoked = await nativeAppleRevoked(owner);

      if (!current(owner) || requestRevision !== revision) {
        return;
      }

      if (revoked) {
        const cookie = await owner.retire();
        await remoteSignOut(cookie);

        if (active === owner) {
          active = null;
          publish({ kind: "signed-out" });
        }

        return;
      }

      const account = await owner.api.fetchAccount();
      owner.acceptAccount(account);

      if (current(owner) && requestRevision === revision) {
        publish({
          account,
          authNotice: lastFlowFailure,
          kind: "authenticated",
        });
      }
    } catch (error) {
      if (!current(owner) || requestRevision !== revision) {
        return;
      }

      const result =
        error instanceof AuthFailureError ? error : await networkFailure();

      if (result.code === "invalid-credentials") {
        publish({ kind: "signed-out" });
      } else if (result.code === "offline") {
        publish({ kind: "offline" });
      } else {
        publish({ code: result.code, kind: "unavailable" });
      }
    }
  };

  const start = (): Promise<void> => {
    initialization ??= (async () => {
      try {
        active = await createSessionGeneration();
        await refreshOwner(active);
      } catch {
        publish({ code: "unavailable", kind: "unavailable" });
      }
    })();

    return initialization;
  };

  const owner = async (): Promise<SessionGeneration> => {
    await start();
    await transition;

    if (!active) {
      await rotate(true);
    }

    if (!active) {
      throw new AuthFailureError("unavailable");
    }

    return active;
  };

  const beginAccountChange = async (): Promise<void> => {
    await start();
    verificationEmail = null;
    lastFlowFailure = null;
    await rotate(true);
  };

  const runOwned = async <T,>(
    work: (generation: SessionGeneration) => Promise<T>
  ): Promise<T> => {
    const generation = await owner();
    const result = await work(generation);

    if (!current(generation)) {
      throw new AuthFailureError("stale");
    }

    return result;
  };

  const refreshAuthenticated = async () => {
    await refreshOwner(await owner());

    if (state.kind !== "authenticated") {
      throw new AuthFailureError(failureCode(state));
    }
  };

  const social = createSocialSignIn({
    beginAccountChange,
    refresh: refreshAuthenticated,
    run: runOwned,
  });

  const withFlow = async (work: () => Promise<void>): Promise<void> => {
    const operation = work();
    ownedFlow = operation;

    try {
      await operation;
    } catch (error) {
      if (error instanceof AuthFailureError && error.code !== "stale") {
        lastFlowFailure = error.code;
      }

      if (state.kind === "loading") {
        publish({ kind: "signed-out" });
      }

      throw error;
    } finally {
      if (ownedFlow === operation) {
        ownedFlow = null;
      }
    }
  };

  return {
    beginAccountChange,
    async deleteCurrentAccount(
      idempotencyKey: string
    ): Promise<DeletionReceipt> {
      await start();

      const operation = transition.then(async () => {
        const generation = active;

        if (!generation || state.kind !== "authenticated") {
          throw new AuthFailureError("fresh-auth-required");
        }

        active = null;
        revision += 1;
        publish({ kind: "loading" });

        try {
          const cookie = await generation.retire();
          const receipt = await requestDeletion(cookie, idempotencyKey);
          publish({ deletion: receipt, kind: "signed-out" });

          return receipt;
        } catch (error) {
          publish({ kind: "signed-out", notice: "deletion-unconfirmed" });
          throw error;
        }
      });

      transition = operation.then(
        () => true,
        () => false
      );

      return operation;
    },
    getState: () => state,
    async handleCallback(
      flow: string | undefined,
      queryError: string | undefined
    ): Promise<void> {
      const issue = oauthCallbackFailure(queryError);

      if (ownedFlow) {
        try {
          await ownedFlow;
        } catch (error) {
          throw issue ?? error;
        }

        return;
      }

      if (flow === "verification") {
        await beginAccountChange();
        publish({ kind: "signed-out", notice: "verification-returned" });

        if (issue) {
          throw issue;
        }

        return;
      }

      // A cold callback never imports its cookie parameter; validate only the stored proof.
      await refreshOwner(await owner());

      if (issue) {
        throw issue;
      }

      if (state.kind !== "authenticated") {
        publish({ kind: "signed-out", notice: "social-interrupted" });
      }
    },
    linkSignInMethod: (provider: "google" | "apple") =>
      withFlow(() => social.linkSignInMethod(provider)),
    networkDisconnected(): void {
      revision += 1;

      if (active) {
        publish({ kind: "offline" });
      }
    },
    async refresh(): Promise<void> {
      try {
        if (ownedFlow) {
          await ownedFlow.catch(() => {
            // Cancellation does not establish a session; refresh still checks the server.
          });
        }

        if (
          state.kind === "signed-out" &&
          (state.deletion || state.notice === "deletion-unconfirmed")
        ) {
          return;
        }

        await refreshOwner(await owner());
      } catch {
        publish({ code: "unavailable", kind: "unavailable" });
      }
    },
    async register(input: {
      email: string;
      password: string;
      name: string;
      language: Language;
    }): Promise<void> {
      await beginAccountChange();
      const generation = await owner();

      const result = await generation.client.signUp.email({
        callbackURL: authCallback("verification"),
        email: input.email,
        name: input.name,
        password: input.password,
        preferredLanguage: input.language,
      });

      if (!current(generation)) {
        throw new AuthFailureError("stale");
      }

      if (result.error) {
        publish({ kind: "signed-out" });
        throw await failure(result.error);
      }

      verificationEmail = input.email;
      publish({ email: input.email, kind: "verification-required" });
    },
    async requestReset(email: string): Promise<void> {
      const generation = await owner();

      const result = await generation.client.requestPasswordReset({
        email,
        redirectTo: resetCallback(),
      });

      if (!current(generation)) {
        throw new AuthFailureError("stale");
      }

      if (result.error) {
        publish({ kind: "signed-out" });
        throw await failure(result.error);
      }
    },
    async resend(email: string): Promise<void> {
      const generation = await owner();

      const result = await generation.client.sendVerificationEmail({
        callbackURL: authCallback("verification"),
        email,
      });

      if (!current(generation)) {
        throw new AuthFailureError("stale");
      }

      if (result.error) {
        publish({ kind: "signed-out" });
        throw await failure(result.error);
      }
    },
    async reset(token: string, newPassword: string): Promise<void> {
      await beginAccountChange();
      const generation = await owner();

      const result = await generation.client.resetPassword({
        newPassword,
        token,
      });

      if (!current(generation)) {
        throw new AuthFailureError("stale");
      }

      if (result.error) {
        publish({ kind: "signed-out" });
        throw await failure(result.error);
      }

      publish({ kind: "signed-out", notice: "password-updated" });
    },
    run: runOwned,
    async signIn(email: string, password: string): Promise<void> {
      await beginAccountChange();
      const generation = await owner();
      const result = await generation.client.signIn.email({ email, password });

      if (!current(generation)) {
        throw new AuthFailureError("stale");
      }

      if (result.error) {
        const issue = await failure(result.error);

        if (issue.code === "email-unverified") {
          verificationEmail = email;
          publish({ email, kind: "verification-required" });
        } else {
          publish({ kind: "signed-out" });
        }

        throw issue;
      }

      if (!result.data) {
        publish({ kind: "signed-out" });
        throw new AuthFailureError("unavailable");
      }

      generation.acceptPrincipal(result.data.user);
      await refreshOwner(generation);

      if (current(generation) && state.kind !== "authenticated") {
        throw new AuthFailureError(failureCode(state));
      }
    },
    signInWithApple: () => withFlow(social.signInWithApple),
    signInWithGoogle: () => withFlow(social.signInWithGoogle),
    async signOut(): Promise<void> {
      await start();
      verificationEmail = null;
      const confirmed = await rotate(false);
      publish(
        confirmed
          ? { kind: "signed-out" }
          : { kind: "signed-out", notice: "remote-unconfirmed" }
      );
    },
    start,
    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    async verify(token: string): Promise<void> {
      await beginAccountChange();
      const generation = await owner();
      const result = await generation.client.verifyEmail({ query: { token } });

      if (!current(generation)) {
        throw new AuthFailureError("stale");
      }

      if (result.error) {
        publish({ kind: "signed-out" });
        throw await failure(result.error);
      }

      publish({ kind: "signed-out", notice: "verified" });
    },
  };
};

export type SessionController = ReturnType<typeof createSessionController>;

const SessionContext = createContext<SessionController | null>(null);

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const controller = useMemo(() => createSessionController(), []);
  useEffect(() => {
    void controller.start();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void controller.refresh();
      }
    });

    const network = Network.addNetworkStateListener((value) => {
      if (value.isConnected === false || value.isInternetReachable === false) {
        controller.networkDisconnected();
      } else {
        void controller.refresh();
      }
    });

    return () => {
      subscription.remove();
      network.remove();
    };
  }, [controller]);

  return <SessionContext value={controller}>{children}</SessionContext>;
};

export const useSession = () => {
  const controller = use(SessionContext);

  if (!controller) {
    throw new Error("Session provider is missing.");
  }

  const state = useSyncExternalStore(controller.subscribe, controller.getState);

  return { controller, state };
};
