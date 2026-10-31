import { passwordPolicy, passwordSchema } from "@gloups/contracts";
import { colors } from "@gloups/ui";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import { errorMessage, performSocialAction } from "./auth-actions";
import { authClient, signOut } from "./auth-client";
import type { SocialProvider } from "./auth-client";
import { ProviderButtons, providerName } from "./provider-buttons";
import { changeMethod, loadMethods } from "./sign-in-methods";
import type { SignInMethod } from "./sign-in-methods";

const styles = StyleSheet.create({
  container: { gap: 12 },
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

export const AccountMethods = ({
  message,
  onChanged,
  onMessage,
}: {
  message: string;
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
}) => {
  const [methods, setMethods] = useState<SignInMethod[] | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<SignInMethod | null>(null);

  useEffect(() => {
    let active = true;
    void loadMethods()
      .then((data) => {
        if (active) {
          setMethods(data);
        }

        return null;
      })
      .catch(() => {
        if (active) {
          onMessage(
            "We could not load your sign-in methods. Reopen your account to try again."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [onMessage]);

  const run = async (action: () => Promise<void>) => {
    if (busy) {
      return;
    }

    setBusy(true);
    onMessage("");

    try {
      await action();
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : "We could not change your sign-in methods. Try again."
      );
    }

    setPassword("");
    setBusy(false);
  };

  const link = (provider: SocialProvider) =>
    run(async () => {
      const outcome = await performSocialAction(provider, true);
      await onChanged();
      onMessage(
        outcome.completed
          ? `${providerName(provider)} linked.`
          : outcome.message
      );
      setMethods(await loadMethods());
    });

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Sign-in methods</Text>
      {methods?.map((method) => (
        <View key={method.id}>
          <Text>{`${providerName(method.providerId)}${method.available ? "" : " — access lost"}`}</Text>
          <Button
            disabled={busy}
            title={`Remove ${providerName(method.providerId)}`}
            onPress={() => setRemoving(method)}
          />
        </View>
      ))}
      <ProviderButtons
        busy={busy}
        linkedProviders={
          methods
            ?.filter((method) => method.available)
            .map((method) => method.providerId) ?? []
        }
        linking
        onPress={(provider) => {
          void link(provider);
        }}
      />
      {methods &&
        !methods.some((method) => method.providerId === "credential") && (
          <>
            <Text>Add a password to your verified email</Text>
            <TextInput
              accessibilityLabel="New password"
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!busy}
              onChangeText={setPassword}
              placeholder="New password"
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <Button
              disabled={busy}
              title="Add password"
              onPress={() => {
                void run(async () => {
                  const parsed = passwordSchema.safeParse(password);

                  if (!parsed.success) {
                    onMessage(
                      `Use a password of ${passwordPolicy.minimumLength} to ${passwordPolicy.maximumLength} characters.`
                    );

                    return;
                  }

                  await changeMethod("/methods/password", {
                    newPassword: parsed.data,
                  });
                  setMethods(await loadMethods());
                  onMessage(
                    "Password added. You can now sign in with your email and password."
                  );
                });
              }}
            />
          </>
        )}
      {removing && (
        <View>
          <Text>{`Remove ${providerName(removing.providerId)}? This signs you out on every device. You must keep another available sign-in method.`}</Text>
          <Button
            disabled={busy}
            title="Confirm removal"
            onPress={() => {
              void run(async () => {
                await changeMethod("/methods/unlink", {
                  accountId: removing.id,
                });
                await signOut();
                await onChanged();
              });
            }}
          />
          <Button
            disabled={busy}
            title="Keep method"
            onPress={() => setRemoving(null)}
          />
        </View>
      )}
      <Button
        disabled={busy}
        title="Sign out all devices"
        onPress={() => {
          void run(async () => {
            const response = await authClient.revokeSessions();

            if (response.error) {
              throw new Error(errorMessage(response.error));
            }

            await signOut();
            await onChanged();
          });
        }}
      />
      {message !== "" && (
        <Text accessibilityLiveRegion="polite" accessibilityRole="alert">
          {message}
        </Text>
      )}
      <Text>
        If you lose every linked method, recover access with Apple or Google
        first. Gloups cannot restore access from a matching email alone.
      </Text>
    </View>
  );
};
