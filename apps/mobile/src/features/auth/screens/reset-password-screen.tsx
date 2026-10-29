import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import {
  TextLink,
  Action,
  Copy,
  Failure,
  Panel,
  PasswordField,
  useAction,
} from "../form-ui";
import { useLanguage } from "../language";
import { useSession } from "../session-controller";

export const ResetPasswordScreen = () => {
  const { controller } = useSession();
  const { strings } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = useRef<string | null>(null);
  const [hasProof, setHasProof] = useState(false);
  const [password, setPassword] = useState("");
  const action = useAction();
  useEffect(() => {
    if (!params.token) {
      return;
    }

    token.current = params.token;
    // oxlint-disable-next-line react/set-state-in-effect -- A native deep link provides a new one-time proof.
    setHasProof(true);
    router.setParams({ token: undefined });
    void action.run(
      async () => {
        await controller.beginAccountChange();
        setPassword("");
      },
      { replace: true }
    );
  }, [params.token, router, controller, action]);

  return (
    <Panel testID="reset-password-screen">
      <Stack.Screen options={{ title: strings.resetPassword }} />
      {hasProof ? (
        <>
          <PasswordField
            label={strings.newPassword}
            newPassword
            onChangeText={setPassword}
            testID="reset-password"
            value={password}
          />
          <Copy>{strings.passwordHint}</Copy>
          <Failure code={action.error} />
          <Action
            label={strings.resetPassword}
            onPress={() => {
              void action.run(async () => {
                const proof = z.string().min(1).max(4096).parse(token.current);
                await controller.reset(
                  proof,
                  z.string().min(15).max(128).parse(password)
                );
                token.current = null;
                setPassword("");
                router.replace("/sign-in");
              });
            }}
            pending={action.pending}
            testID="reset-submit"
          />
        </>
      ) : (
        <Copy>{strings.invalidLink}</Copy>
      )}
      <TextLink href="/forgot-password">{strings.sendReset}</TextLink>
      <TextLink href="/sign-in">{strings.backToSignIn}</TextLink>
    </Panel>
  );
};
