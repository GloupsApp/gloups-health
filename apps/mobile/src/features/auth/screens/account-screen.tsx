import { Host, List, ListItem, Text } from "@expo/ui";
import { Redirect, Stack, useRouter } from "expo-router";
import { View } from "react-native";

import { gloupsColors } from "@/design/colors";

import { Failure, useAction, useTheme } from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";

export const AccountScreen = () => {
  const { controller, state } = useSession();
  const { strings } = useLanguage();
  const theme = useTheme();
  const router = useRouter();
  const action = useAction();

  if (state.kind !== "authenticated") {
    return <Redirect href="/" />;
  }

  return (
    <View
      style={{ backgroundColor: theme.background, flex: 1 }}
      testID="account-screen"
    >
      <Stack.Screen options={{ title: strings.account }} />
      <Failure code={action.error ?? state.authNotice} />
      <Host seedColor={gloupsColors.metricBlue} style={{ flex: 1 }}>
        <List>
          <ListItem
            onPress={() => router.push("/(account)/sign-in-methods")}
            testID="account-methods"
          >
            <Text>{strings.methods}</Text>
          </ListItem>
          <ListItem
            onPress={() => router.push("/(account)/delete-account")}
            testID="account-delete"
          >
            <Text>{strings.deleteAccount}</Text>
          </ListItem>
          <ListItem
            supportingText={
              state.account.user.name ? state.account.user.email : ""
            }
            testID="account-identity"
          >
            <Text>{state.account.user.name || state.account.user.email}</Text>
          </ListItem>
          <ListItem
            onPress={() => {
              void action.run(async () => {
                await controller.signOut();
                router.replace("/sign-in");
              });
            }}
            testID="account-sign-out"
          >
            <Text>{strings.signOut}</Text>
          </ListItem>
        </List>
      </Host>
    </View>
  );
};
