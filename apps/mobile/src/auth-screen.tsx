import { passwordPolicy } from "@gloups/contracts";
import { colors, Heading } from "@gloups/ui";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import { performAuthAction, performSocialAction } from "./auth-actions";
import type { AuthMode } from "./auth-actions";
import type { SocialProvider } from "./auth-client";
import { ProviderButtons } from "./provider-buttons";

const styles = StyleSheet.create({
  form: { gap: 12 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    padding: 14,
  },
});

export const AuthScreen = ({
  onSignedIn,
  resetToken,
}: {
  onSignedIn: () => Promise<void>;
  resetToken: string | null;
}) => {
  const [mode, setMode] = useState<AuthMode>(resetToken ? "reset" : "sign-in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const changeMode = (next: AuthMode) => {
    setPassword("");
    setMessage("");
    setMode(next);
  };

  const submit = async () => {
    if (busy) {
      return;
    }

    setMessage("");
    setBusy(true);

    const outcome = await performAuthAction({
      email,
      mode,
      name,
      password,
      resetToken,
    });

    setBusy(false);
    setMode(outcome.mode);
    setMessage(outcome.message);

    if (outcome.clearPassword) {
      setPassword("");
    }

    if (outcome.signedIn) {
      await onSignedIn();
    }
  };

  const signInWith = async (provider: SocialProvider) => {
    if (busy) {
      return;
    }

    setBusy(true);
    setPassword("");
    setMessage("");
    const outcome = await performSocialAction(provider);
    setMessage(outcome.message);
    setBusy(false);

    if (outcome.completed) {
      await onSignedIn();
    }
  };

  const titles: Record<AuthMode, string> = {
    recover: "Reset your password",
    reset: "Choose a new password",
    "sign-in": "Welcome to Gloups",
    "sign-up": "Create your account",
    verify: "Check your email",
  };

  const actions: Record<AuthMode, string> = {
    recover: "Send reset link",
    reset: "Save new password",
    "sign-in": "Sign in",
    "sign-up": "Create account",
    verify: "Resend verification email",
  };

  return (
    <View style={styles.form}>
      <Heading>{titles[mode]}</Heading>
      {(mode === "sign-in" || mode === "sign-up") && (
        <ProviderButtons
          busy={busy}
          onPress={(provider) => {
            void signInWith(provider);
          }}
        />
      )}
      {mode === "recover" && (
        <Text>
          If you signed up with Apple or Google, use that linked method. Add
          your first password from your account after signing in.
        </Text>
      )}
      {mode === "verify" && (
        <Text>
          Open the verification link in your email, then return here to sign in.
        </Text>
      )}
      {mode === "sign-up" && (
        <>
          <Text>Display name (optional)</Text>
          <TextInput
            accessibilityLabel="Display name"
            autoComplete="name"
            editable={!busy}
            maxLength={100}
            onChangeText={setName}
            style={styles.input}
            value={name}
          />
        </>
      )}
      {mode !== "reset" && (
        <>
          <Text>Email</Text>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!busy}
            keyboardType="email-address"
            onChangeText={setEmail}
            style={styles.input}
            value={email}
          />
        </>
      )}
      {(mode === "sign-in" || mode === "sign-up" || mode === "reset") && (
        <>
          <Text>Password</Text>
          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            autoCorrect={false}
            editable={!busy}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {mode !== "sign-in" && (
            <Text>{`Use ${passwordPolicy.minimumLength} to ${passwordPolicy.maximumLength} characters.`}</Text>
          )}
        </>
      )}
      {message !== "" && (
        <Text accessibilityLiveRegion="polite" accessibilityRole="alert">
          {message}
        </Text>
      )}
      <Button
        disabled={busy}
        onPress={() => {
          void submit();
        }}
        title={busy ? "Please wait…" : actions[mode]}
      />
      {mode === "sign-in" ? (
        <>
          <Button
            disabled={busy}
            onPress={() => changeMode("sign-up")}
            title="Create an account"
          />
          <Button
            disabled={busy}
            onPress={() => changeMode("recover")}
            title="Forgot password?"
          />
        </>
      ) : (
        <Button
          disabled={busy}
          onPress={() => changeMode("sign-in")}
          title="Back to sign in"
        />
      )}
    </View>
  );
};
