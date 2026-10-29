import { Redirect, Stack } from "expo-router";

import {
  TextLink,
  Action,
  Copy,
  Failure,
  Loading,
  Panel,
  useAction,
} from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";

export const SessionScreen = () => {
  const { controller, state } = useSession();
  const { strings } = useLanguage();
  const action = useAction();

  if (state.kind === "authenticated") {
    return <Redirect href="/(account)" />;
  }

  if (
    state.kind === "signed-out" &&
    (state.deletion || state.notice === "deletion-unconfirmed")
  ) {
    return <Redirect href="/auth/deletion" />;
  }

  if (state.kind === "signed-out") {
    return <Redirect href="/sign-in" />;
  }

  if (state.kind === "verification-required") {
    return <Redirect href="/verify-email" />;
  }

  return (
    <Panel testID="session-screen">
      <Stack.Screen options={{ title: "Gloups" }} />
      {state.kind === "loading" ? (
        <Loading />
      ) : (
        <>
          <Copy>
            {state.kind === "offline" ? strings.offline : strings.unavailable}
          </Copy>
          <Failure code={state.kind === "unavailable" ? state.code : null} />
          <Action
            label={strings.retry}
            onPress={() => {
              void controller.refresh();
            }}
            testID="session-retry"
          />
          <TextLink href="/sign-in">{strings.signIn}</TextLink>
          <Action
            label={strings.signOut}
            onPress={() => {
              void action.run(() => controller.signOut());
            }}
            secondary
            testID="session-sign-out"
          />
        </>
      )}
    </Panel>
  );
};
