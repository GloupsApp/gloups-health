import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

export const VerifyEmailScreen = () => {
  const { controller, state } = useSession();
  const { strings } = useLanguage();
  const router = useRouter();
  const { token: incomingToken } = useLocalSearchParams<{ token?: string }>();
  const consumed = useRef<string | null>(null);

  const [email, setEmail] = useState(
    state.kind === "verification-required" ? state.email : ""
  );

  const [sent, setSent] = useState(false);
  const action = useAction();
  useEffect(() => {
    if (!incomingToken || consumed.current === incomingToken) {
      return;
    }

    const token = incomingToken;
    consumed.current = token;
    router.setParams({ token: undefined });
    void action.run(
      async () => {
        try {
          await controller.verify(z.string().min(1).max(4096).parse(token));
        } catch (error) {
          if (consumed.current === token) {
            consumed.current = null;
          }

          throw error;
        }

        if (consumed.current === token) {
          consumed.current = null;
        }

        router.replace("/sign-in");
      },
      { replace: true }
    );
  }, [incomingToken, router, controller, action]);

  return (
    <Panel testID="verify-email-screen">
      <Stack.Screen options={{ title: strings.checkEmail }} />
      <Copy>{strings.checkEmailBody}</Copy>
      <Field
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={strings.email}
        onChangeText={setEmail}
        testID="verification-email"
        value={email}
      />
      <Failure code={action.error} />
      {sent ? <Copy>{strings.sent}</Copy> : null}
      <Action
        label={strings.resend}
        onPress={() => {
          void action.run(async () => {
            await controller.resend(z.email().parse(email.trim()));
            setSent(true);
          });
        }}
        pending={action.pending}
        testID="verification-resend"
      />
      <TextLink href="/sign-in">{strings.backToSignIn}</TextLink>
    </Panel>
  );
};
