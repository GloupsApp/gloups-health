import { colors, Heading } from "@gloups/ui";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AccountMethods } from "./account-methods";
import { AuthScreen } from "./auth-screen";
import { useAccount } from "./use-account";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 20,
    justifyContent: "center",
    padding: 28,
    paddingBottom: 48,
    paddingTop: 72,
  },
  content: { gap: 20 },
  root: { backgroundColor: colors.background, flex: 1 },
});

export const App = () => {
  const { state, refresh, leave } = useAccount();
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState("");
  const [methodMessage, setMethodMessage] = useState("");
  const [authRevision, setAuthRevision] = useState(0);
  useEffect(() => {
    const handleLink = (url: string) => {
      const link = new URL(url);

      if (link.protocol !== "gloups-health:") {
        return;
      }

      if (link.hostname === "reset-password") {
        setResetToken(link.searchParams.get("token"));
        setAuthRevision((value) => value + 1);
        setLinkMessage(
          link.searchParams.has("error")
            ? "This reset link has expired. Request a new link."
            : ""
        );
      } else if (link.hostname === "verified") {
        setResetToken(null);
        setAuthRevision((value) => value + 1);
        setLinkMessage(
          link.searchParams.has("error")
            ? "This verification link is invalid or has expired. Request a new link."
            : "Email verified. You can sign in now."
        );
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleLink(url);
      }

      return null;
    });

    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleLink(url)
    );

    return () => subscription.remove();
  }, []);
  let content;

  if (state.status === "loading") {
    content = <ActivityIndicator accessibilityLabel="Checking your account" />;
  } else if (state.status === "authenticated") {
    content = (
      <View style={styles.content}>
        <Heading>Your account</Heading>
        {state.data.user.name !== "" && <Text>{state.data.user.name}</Text>}
        <Text testID="account-email">{state.data.user.email}</Text>
        <Text>Your email is verified.</Text>
        <Button
          onPress={() => {
            setMethodMessage("");
            void leave();
          }}
          title="Sign out"
        />
        <AccountMethods
          message={methodMessage}
          onChanged={refresh}
          onMessage={setMethodMessage}
        />
      </View>
    );
  } else if (state.status === "unavailable") {
    content = (
      <View style={styles.content}>
        <Text>
          We could not check your account. Check your connection and try again.
        </Text>
        <Button
          onPress={() => {
            void refresh();
          }}
          title="Try again"
        />
        <Button
          onPress={() => {
            void leave();
          }}
          title="Sign out on this device"
        />
      </View>
    );
  } else {
    content = (
      <>
        {state.remoteSignOutUnconfirmed && (
          <Text>
            You are signed out on this device. Server sign-out could not be
            confirmed.
          </Text>
        )}
        {linkMessage !== "" && (
          <Text accessibilityLiveRegion="polite">{linkMessage}</Text>
        )}
        <AuthScreen
          key={`${resetToken ?? "credentials"}-${authRevision}`}
          onSignedIn={async () => {
            setMethodMessage("");
            setResetToken(null);
            setLinkMessage("");
            await refresh();
          }}
          resetToken={resetToken}
        />
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
