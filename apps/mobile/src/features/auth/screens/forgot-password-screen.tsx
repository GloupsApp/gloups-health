import { Stack } from "expo-router";
import { useState } from "react";
import { z } from "zod";

import {
  TextLink,
  Action,
  Copy,
  Failure,
  Field,
  Panel,
  useAction,
} from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";

export const ForgotPasswordScreen = () => {
  const { controller } = useSession();
  const { strings } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const action = useAction();

  return (
    <Panel testID="forgot-password-screen">
      <Stack.Screen options={{ title: strings.resetPassword }} />
      <Field
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={strings.email}
        onChangeText={setEmail}
        testID="recovery-email"
        textContentType="emailAddress"
        value={email}
      />
      <Failure code={action.error} />
      {sent ? <Copy>{strings.recoveryBody}</Copy> : null}
      <Action
        label={strings.sendReset}
        onPress={() => {
          void action.run(async () => {
            await controller.requestReset(z.email().parse(email.trim()));
            setSent(true);
          });
        }}
        pending={action.pending}
        testID="recovery-submit"
      />
      <TextLink href="/sign-in">{strings.backToSignIn}</TextLink>
    </Panel>
  );
};
