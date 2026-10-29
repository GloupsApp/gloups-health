import { Button, Host } from "@expo/ui";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import type { TextInputProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { gloupsColors, gloupsThemes } from "@/design/colors";

import { AuthFailureError } from "./errors";
import type { AuthFailureCode } from "./errors";
import { useLanguage } from "./language";
import type { en } from "./strings.en";

export const useTheme = () =>
  gloupsThemes[useColorScheme() === "dark" ? "dark" : "light"];

export const Panel = ({
  children,
  testID,
}: { testID: string } & PropsWithChildren) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        testID={testID}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 24 + insets.bottom,
        }}
      >
        <View
          style={{ alignSelf: "center", gap: 20, maxWidth: 560, width: "100%" }}
        >
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const Action = ({
  label,
  onPress,
  pending = false,
  secondary = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  pending?: boolean;
  secondary?: boolean;
  testID: string;
}) => (
  <Host matchContents seedColor={gloupsColors.metricBlue}>
    <Button
      style={{ paddingVertical: 8 }}
      disabled={pending}
      label={label}
      onPress={onPress}
      testID={testID}
      variant={secondary ? "text" : "filled"}
    />
  </Host>
);

export const Copy = ({
  children,
  error = false,
}: { error?: boolean } & PropsWithChildren) => {
  const theme = useTheme();

  return (
    <Text
      accessibilityLiveRegion={error ? "polite" : "none"}
      selectable
      style={{
        color: error ? theme.danger : theme.ink,
        fontSize: 17,
        lineHeight: 25,
      }}
    >
      {children}
    </Text>
  );
};

export const Loading = () => {
  const { strings } = useLanguage();

  return (
    <>
      <ActivityIndicator accessibilityLabel={strings.loading} />
      <Copy>{strings.loading}</Copy>
    </>
  );
};

export const Field = ({
  label,
  testID,
  ...props
}: { label: string; testID: string } & TextInputProps) => {
  const theme = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <Copy>{label}</Copy>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={theme.muted}
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: 12,
          borderWidth: 1,
          color: theme.ink,
          fontSize: 17,
          minHeight: 52,
          padding: 14,
        }}
        testID={testID}
      />
    </View>
  );
};

export const PasswordField = ({
  label,
  value,
  onChangeText,
  testID,
  newPassword = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  testID: string;
  newPassword?: boolean;
}) => {
  const [visible, setVisible] = useState(false);
  const { strings } = useLanguage();

  return (
    <View style={{ gap: 8 }}>
      <Field
        autoCapitalize="none"
        autoComplete={newPassword ? "new-password" : "current-password"}
        autoCorrect={false}
        label={label}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        testID={testID}
        textContentType={newPassword ? "newPassword" : "password"}
        value={value}
      />
      <Action
        label={visible ? strings.hidePassword : strings.showPassword}
        onPress={() => setVisible((current) => !current)}
        secondary
        testID={`${testID}-visibility`}
      />
    </View>
  );
};

export const TextLink = ({
  href,
  children,
}: { href: Href } & PropsWithChildren) => {
  const theme = useTheme();

  return (
    <Link
      href={href}
      style={{
        color: theme.protein,
        fontSize: 17,
        minHeight: 44,
        paddingVertical: 10,
      }}
    >
      {children}
    </Link>
  );
};

const errorLabels = {
  "apple-email-required": "appleEmailRequired",
  "apple-unconfirmed": "appleUnconfirmed",
  cancelled: "cancelled",
  "email-unverified": "emailUnverified",
  "fresh-auth-required": "freshAuthRequired",
  "identity-conflict": "identityConflict",
  "invalid-credentials": "invalidCredentials",
  "invalid-link": "invalidLink",
  offline: "offline",
  "rate-limited": "rateLimited",
  stale: "unavailable",
  unavailable: "unavailable",
} satisfies Record<AuthFailureCode, keyof typeof en>;

export const useAction = () => {
  const [pending, setPending] = useState(false);

  const [error, setError] = useState<AuthFailureCode | "invalid-input" | null>(
    null
  );

  const mounted = useRef(false);
  const invocation = useRef(0);
  const running = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (work: () => Promise<void>, options?: { replace: boolean }) => {
      if (running.current && !options?.replace) {
        return;
      }

      running.current = true;
      invocation.current += 1;
      const id = invocation.current;
      setPending(true);
      setError(null);

      try {
        await work();
      } catch (error_) {
        if (mounted.current && id === invocation.current) {
          if (error_ instanceof AuthFailureError) {
            if (error_.code !== "stale") {
              setError(error_.code);
            }
          } else {
            setError(
              error_ instanceof z.ZodError ? "invalid-input" : "unavailable"
            );
          }
        }
      }

      if (id === invocation.current) {
        running.current = false;

        if (mounted.current) {
          setPending(false);
        }
      }
    },
    []
  );

  return { error, pending, run };
};

export const Failure = ({
  code,
}: {
  code: ReturnType<typeof useAction>["error"];
}) => {
  const { strings } = useLanguage();

  if (!code) {
    return null;
  }

  const key = code === "invalid-input" ? "invalidInput" : errorLabels[code];

  return <Copy error>{strings[key]}</Copy>;
};

export const LanguageControl = () => {
  const { language, setLanguage, strings } = useLanguage();

  return (
    <View style={{ gap: 8 }}>
      <Copy>{strings.language}</Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <Action
          label={strings.english}
          onPress={() => setLanguage("en")}
          pending={language === "en"}
          secondary
          testID="language-en"
        />
        <Action
          label={strings.french}
          onPress={() => setLanguage("fr")}
          pending={language === "fr"}
          secondary
          testID="language-fr"
        />
      </View>
    </View>
  );
};
