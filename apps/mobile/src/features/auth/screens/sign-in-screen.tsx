import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { z } from "zod";

import {
  TextLink,
  Action,
  Copy,
  Failure,
  Field,
  LanguageControl,
  Panel,
  PasswordField,
  useAction,
} from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";
import { SocialActions } from "../social-actions";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

export const SignInScreen = () => {
  const { controller, state } = useSession();
  const { strings } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const action = useAction();
  const logout = useAction();
  const router = useRouter();

  return (
    <Panel testID="sign-in-screen">
      <Stack.Screen options={{ title: strings.signIn }} />
      <Copy>{strings.healthCoach}</Copy>
      <Field
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={strings.email}
        onChangeText={setEmail}
        testID="sign-in-email"
        textContentType="username"
        value={email}
      />
      <PasswordField
        label={strings.password}
        onChangeText={setPassword}
        testID="sign-in-password"
        value={password}
      />
      <Failure code={action.error} />
      <Action
        label={strings.signIn}
        onPress={() => {
          void action.run(async () => {
            const input = credentials.parse({ email: email.trim(), password });
            await controller.signIn(input.email, input.password);

            if (controller.getState().kind === "authenticated") {
              router.replace("/(account)");
            }
          });
        }}
        pending={action.pending}
        testID="sign-in-submit"
      />
      <Failure code={logout.error} />
      {state.kind === "loading" ||
      state.kind === "authenticated" ||
      state.kind === "offline" ||
      state.kind === "unavailable" ? (
        <Action
          label={strings.signOut}
          onPress={() => {
            setPassword("");
            void logout.run(() => controller.signOut());
          }}
          pending={logout.pending}
          secondary
          testID="pending-sign-out"
        />
      ) : null}
      <SocialActions />
      <TextLink href="/forgot-password">{strings.forgotPassword}</TextLink>
      <TextLink href="/sign-up">{strings.createAccount}</TextLink>
      <TextLink href="/verify-email">{strings.verifyEmail}</TextLink>
      {state.kind === "signed-out" && state.notice === "remote-unconfirmed" ? (
        <Copy>{strings.remoteUnconfirmed}</Copy>
      ) : null}
      {state.kind === "signed-out" && state.notice === "verified" ? (
        <Copy>{strings.verified}</Copy>
      ) : null}
      {state.kind === "signed-out" && state.notice === "password-updated" ? (
        <Copy>{strings.passwordUpdated}</Copy>
      ) : null}
      {state.kind === "signed-out" &&
      state.notice === "verification-returned" ? (
        <Copy>{strings.verificationReturned}</Copy>
      ) : null}
      {state.kind === "signed-out" && state.notice === "social-interrupted" ? (
        <Copy>{strings.socialInterrupted}</Copy>
      ) : null}
      <LanguageControl />
    </Panel>
  );
};
