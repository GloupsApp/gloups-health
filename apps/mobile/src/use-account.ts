import type { AccountView } from "@gloups/contracts";
import { AccountApiError } from "@gloups/contracts/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { accountClient, authClient, signOut } from "./auth-client";

type AccountState =
  | { status: "loading" }
  | { status: "signed-out"; remoteSignOutUnconfirmed?: boolean }
  | { status: "unavailable" }
  | { status: "authenticated"; data: AccountView };

export const useAccount = () => {
  const [state, setState] = useState<AccountState>({ status: "loading" });
  const latestStatus = useRef<AccountState["status"]>("loading");
  const generation = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const signingOut = useRef(false);

  const publish = useCallback((next: AccountState) => {
    latestStatus.current = next.status;
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    if (signingOut.current) {
      return;
    }

    generation.current += 1;
    const { current } = generation;
    activeRequest.current?.abort();
    const request = new AbortController();
    activeRequest.current = request;

    if (latestStatus.current !== "signed-out") {
      publish({ status: "loading" });
    }

    try {
      const session = await authClient.getSession({
        fetchOptions: { signal: request.signal },
      });

      if (session.error) {
        if (current === generation.current) {
          publish({ status: "unavailable" });
        }

        return;
      }

      if (!session.data) {
        if (current === generation.current) {
          publish({ status: "signed-out" });
        }

        return;
      }

      const data = await accountClient.current(request.signal);

      if (current === generation.current) {
        publish({ data, status: "authenticated" });
      }
    } catch (error) {
      if (current === generation.current) {
        publish(
          error instanceof AccountApiError && [401, 403].includes(error.status)
            ? { status: "signed-out" }
            : { status: "unavailable" }
        );
      }
    }
  }, [publish]);

  const leave = useCallback(async () => {
    signingOut.current = true;
    generation.current += 1;
    activeRequest.current?.abort();
    publish({ status: "loading" });

    try {
      const confirmed = await signOut();
      signingOut.current = false;
      publish({ remoteSignOutUnconfirmed: !confirmed, status: "signed-out" });
    } catch {
      signingOut.current = false;
      publish({ status: "unavailable" });
    }
  }, [publish]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Synchronize the session with the API on mount.
    void refresh();

    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        void refresh();
      } else if (status === "background") {
        generation.current += 1;
        activeRequest.current?.abort();

        if (latestStatus.current === "authenticated") {
          publish({ status: "loading" });
        }
      }
    });

    return () => {
      generation.current += 1;
      activeRequest.current?.abort();
      subscription.remove();
    };
  }, [publish, refresh]);

  return { leave, refresh, state };
};
