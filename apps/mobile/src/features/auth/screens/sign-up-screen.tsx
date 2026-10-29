import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { z } from "zod";

import {
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

const registration = z.object({
  email: z.email(),
  name: z.string().max(128),
  password: z.string().min(15).max(128),
});

export const SignUpScreen = () => {
  const { controller } = useSession();
  const { language, strings } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const action = useAction();

  return (
    <Panel testID="sign-up-screen">
      <Stack.Screen options={{ title: strings.createAccount }} />
      <Field
        autoCapitalize="words"
        autoComplete="name"
        label={strings.displayName}
        onChangeText={setName}
        testID="sign-up-name"
        textContentType="name"
        value={name}
      />
      <Field
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={strings.email}
        onChangeText={setEmail}
        testID="sign-up-email"
        textContentType="username"
        value={email}
      />
      <PasswordField
        label={strings.password}
        newPassword
        onChangeText={setPassword}
        testID="sign-up-password"
        value={password}
      />
      <Copy>{strings.passwordHint}</Copy>
      <Failure code={action.error} />
      <Action
        label={strings.createAccount}
        onPress={() => {
          void action.run(async () => {
            const input = registration.parse({
              email: email.trim(),
              name,
              password,
            });

            await controller.register({ ...input, language });
            setPassword("");
            router.replace("/verify-email");
          });
        }}
        pending={action.pending}
        testID="sign-up-submit"
      />
      <LanguageControl />
    </Panel>
  );
};
