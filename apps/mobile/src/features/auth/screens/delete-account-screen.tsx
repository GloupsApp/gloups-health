import * as Crypto from "expo-crypto";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert } from "react-native";

import { Action, Copy, Failure, Panel, TextLink, useAction } from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";

export const DeleteAccountScreen = () => {
  const { controller } = useSession();
  const { strings } = useLanguage();
  const router = useRouter();
  const key = useMemo(() => Crypto.randomUUID(), []);
  const action = useAction();

  return (
    <Panel testID="delete-account-screen">
      <Stack.Screen options={{ title: strings.deleteAccount }} />
      <Copy>{strings.deleteBody}</Copy>
      <Failure code={action.error} />
      <Action
        label={strings.confirmDelete}
        onPress={() =>
          Alert.alert(strings.deleteConfirmation, strings.deleteBody, [
            { style: "cancel", text: strings.cancel },
            {
              onPress: () => {
                void action.run(async () => {
                  try {
                    await controller.deleteCurrentAccount(key);
                  } catch {
                    /* The result page explains the interrupted handoff without restoring access. */
                  }

                  router.replace("/auth/deletion");
                });
              },
              style: "destructive",
              text: strings.confirmDelete,
            },
          ])
        }
        pending={action.pending}
        testID="delete-confirm"
      />
      <TextLink href="/sign-in">{strings.freshAuthRequired}</TextLink>
    </Panel>
  );
};
