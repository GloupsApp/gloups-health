import { Host, Column, ListItem, Text } from "@expo/ui";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { z } from "zod";

import { gloupsColors } from "@/design/colors";

import { sdkFailure } from "../errors";
import {
  Action,
  Copy,
  Failure,
  Panel,
  PasswordField,
  TextLink,
  useAction,
} from "../form-ui";
import { useLanguage } from "../language";
import { apiOrigin } from "../runtime";
import { useSession } from "../session-controller";
import { SocialActions } from "../social-actions";

const providerNames = ["google", "apple"] satisfies ("google" | "apple")[];

const providerLabel = (
  provider: "apple" | "google" | "credential",
  passwordLabel: string
) => {
  if (provider === "credential") {
    return passwordLabel;
  }

  return provider === "google" ? "Google" : "Apple";
};

const methodsSchema = z.array(
  z.object({
    accountId: z.string(),
    id: z.string(),
    providerId: z.enum(["apple", "google", "credential"]),
  })
);

export const SignInMethodsScreen = () => {
  const { controller } = useSession();
  const { strings } = useLanguage();

  const [methods, setMethods] = useState<z.infer<typeof methodsSchema> | null>(
    null
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const action = useAction();
  const { run } = action;

  const load = async () => {
    const values = await controller.run(async (generation) => {
      const result = await generation.client.listAccounts();

      if (result.error) {
        throw sdkFailure(result.error);
      }

      return methodsSchema.parse(result.data);
    });

    setMethods(values);
  };

  useEffect(() => {
    void run(async () => {
      const values = await controller.run(async (generation) => {
        const result = await generation.client.listAccounts();

        if (result.error) {
          throw sdkFailure(result.error);
        }

        return methodsSchema.parse(result.data);
      });

      setMethods(values);
    });
  }, [controller, run]);

  const hasPassword =
    methods?.some((method) => method.providerId === "credential") ?? false;

  return (
    <Panel testID="methods-screen">
      <Stack.Screen options={{ title: strings.methods }} />
      <Failure code={action.error} />
      {methods ? (
        <Host matchContents seedColor={gloupsColors.metricBlue}>
          <Column spacing={16}>
            {methods.map((method) => (
              <ListItem
                key={method.id}
                onPress={
                  methods.length > 1
                    ? () =>
                        Alert.alert(strings.unlink, method.providerId, [
                          { style: "cancel", text: strings.cancel },
                          {
                            onPress: () => {
                              void run(async () => {
                                await controller.run(async (generation) => {
                                  const result =
                                    await generation.client.unlinkAccount({
                                      accountId: method.id,
                                    });

                                  if (result.error) {
                                    throw sdkFailure(result.error);
                                  }
                                });
                                await load();
                              });
                            },
                            style: "destructive",
                            text: strings.unlink,
                          },
                        ])
                    : () => Alert.alert(strings.lastMethod)
                }
                supportingText={
                  methods.length > 1 ? strings.unlink : strings.lastMethod
                }
                testID={`method-${method.providerId}`}
              >
                <Text>
                  {providerLabel(method.providerId, strings.password)}
                </Text>
              </ListItem>
            ))}
          </Column>
        </Host>
      ) : (
        <Copy>{strings.loading}</Copy>
      )}
      <SocialActions
        link
        providers={
          methods
            ? providerNames.filter(
                (provider) =>
                  !methods.some((method) => method.providerId === provider)
              )
            : []
        }
      />
      <TextLink href="/sign-in">{strings.freshAuthRequired}</TextLink>
      {hasPassword ? (
        <PasswordField
          label={strings.currentPassword}
          onChangeText={setCurrentPassword}
          testID="current-password"
          value={currentPassword}
        />
      ) : null}
      <PasswordField
        label={strings.newPassword}
        newPassword
        onChangeText={setNewPassword}
        testID="new-password"
        value={newPassword}
      />
      <Copy>{strings.passwordHint}</Copy>
      {saved ? <Copy>{strings.success}</Copy> : null}
      <Action
        label={hasPassword ? strings.changePassword : strings.setPassword}
        onPress={() => {
          void run(async () => {
            const password = z.string().min(15).max(128).parse(newPassword);
            await controller.run(async (generation) => {
              const result = hasPassword
                ? await generation.client.changePassword({
                    currentPassword,
                    newPassword: password,
                    revokeOtherSessions: true,
                  })
                : await generation.client.$fetch(
                    `${apiOrigin}/api/identity/password`,
                    { body: { newPassword: password }, method: "POST" }
                  );

              if (result.error) {
                throw sdkFailure(result.error);
              }
            });
            setCurrentPassword("");
            setNewPassword("");
            setSaved(true);
            await load();
          });
        }}
        pending={action.pending || !methods}
        testID="password-save"
      />
    </Panel>
  );
};
