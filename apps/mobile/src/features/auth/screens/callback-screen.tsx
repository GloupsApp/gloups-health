import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { Copy, Failure, Loading, Panel, TextLink, useAction } from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";

export const CallbackScreen = () => {
  const { controller } = useSession();
  const { strings } = useLanguage();

  const {
    flow,
    error: incomingError,
    cookie,
  } = useLocalSearchParams<{
    flow?: string;
    error?: string;
    cookie?: string;
    token?: string;
  }>();

  const router = useRouter();
  const handled = useRef(false);
  const { error, pending, run } = useAction();
  useEffect(() => {
    if (!flow && !incomingError && !cookie) {
      handled.current = false;

      return;
    }

    if (handled.current) {
      return;
    }

    handled.current = true;
    router.setParams({
      cookie: undefined,
      error: undefined,
      flow: undefined,
      token: undefined,
    });
    void run(
      async () => {
        await controller.handleCallback(flow, incomingError);
        router.replace(
          controller.getState().kind === "authenticated"
            ? "/(account)"
            : "/sign-in"
        );
      },
      { replace: true }
    );
  }, [flow, incomingError, cookie, controller, router, run]);

  return (
    <Panel testID="callback-screen">
      <Stack.Screen options={{ title: strings.signIn }} />
      {pending || flow || cookie || incomingError ? <Loading /> : null}
      {pending || flow || cookie || incomingError || error ? null : (
        <Copy>{strings.invalidLink}</Copy>
      )}
      <Failure code={error} />
      {error === "invalid-link" ? (
        <TextLink href="/verify-email">{strings.resend}</TextLink>
      ) : null}
      <TextLink href="/sign-in">{strings.backToSignIn}</TextLink>
    </Panel>
  );
};
