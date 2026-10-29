/* oxlint-disable react/style-prop-object -- Expo StatusBar.style selects an appearance string, not a React Native style object. */
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";

import { useTheme } from "@/features/auth/form-ui";
import { LanguageProvider } from "@/features/auth/language";
import {
  SessionProvider,
  useSession,
} from "@/features/auth/session-controller";

const Navigation = () => {
  const { state } = useSession();
  const theme = useTheme();

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: theme.ink,
        }}
      >
        <Stack.Screen name="index" options={{ title: "Gloups" }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ title: "Gloups" }} />
        <Stack.Protected guard={state.kind === "authenticated"}>
          <Stack.Screen name="(account)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
};

const RootLayout = () => (
  <LanguageProvider>
    <SessionProvider>
      <Navigation />
    </SessionProvider>
  </LanguageProvider>
);

export default RootLayout;
