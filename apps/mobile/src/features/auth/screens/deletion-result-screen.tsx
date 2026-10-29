import { Stack } from "expo-router";

import { Copy, Panel, TextLink } from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";

export const DeletionResultScreen = () => {
  const { state } = useSession();
  const { strings } = useLanguage();
  const receipt = state.kind === "signed-out" ? state.deletion : null;

  return (
    <Panel testID="deletion-result-screen">
      <Stack.Screen options={{ title: strings.deleteAccount }} />
      {receipt ? (
        <>
          <Copy>
            {receipt.gloups === "deleted"
              ? strings.accountDeleted
              : strings.accountDeletionPending}
          </Copy>
          {receipt.appleRevocation === "pending" ? (
            <Copy>{strings.applePending}</Copy>
          ) : null}
          {receipt.appleRevocation === "manual_required" ? (
            <Copy>{strings.appleManual}</Copy>
          ) : null}
        </>
      ) : (
        <Copy>{strings.deleteInterrupted}</Copy>
      )}
      <TextLink href="/sign-in">{strings.backToSignIn}</TextLink>
    </Panel>
  );
};
