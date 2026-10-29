import * as Apple from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme, View } from "react-native";

import { Action, Failure, useAction } from "./form-ui";
import { useLanguage } from "./language";
import { useSession } from "./session-controller";

const allProviders = ["google", "apple"] satisfies ("google" | "apple")[];

export const SocialActions = ({
  link = false,
  providers = allProviders,
}: {
  link?: boolean;
  providers?: readonly ("google" | "apple")[];
}) => {
  const { controller } = useSession();
  const { strings } = useLanguage();
  const router = useRouter();
  const dark = useColorScheme() === "dark";
  const [appleAvailable, setAppleAvailable] = useState(false);
  const action = useAction();
  useEffect(() => {
    if (process.env.EXPO_OS === "ios") {
      void Apple.isAvailableAsync().then(setAppleAvailable, () =>
        setAppleAvailable(false)
      );
    }
  }, []);

  const signIn = (provider: "google" | "apple") => {
    void action.run(async () => {
      if (link) {
        await controller.linkSignInMethod(provider);
      } else if (provider === "google") {
        await controller.signInWithGoogle();
      } else {
        await controller.signInWithApple();
      }

      if (controller.getState().kind === "authenticated") {
        router.replace(link ? "/(account)/sign-in-methods" : "/(account)");
      }
    });
  };

  let appleButton = null;

  if (providers.includes("apple")) {
    if (process.env.EXPO_OS === "ios") {
      if (appleAvailable) {
        appleButton = (
          <Apple.AppleAuthenticationButton
            buttonStyle={
              dark
                ? Apple.AppleAuthenticationButtonStyle.WHITE
                : Apple.AppleAuthenticationButtonStyle.BLACK
            }
            buttonType={Apple.AppleAuthenticationButtonType.CONTINUE}
            cornerRadius={8}
            onPress={() => signIn("apple")}
            style={{ height: 48, width: "100%" }}
            testID="apple-sign-in"
          />
        );
      }
    } else {
      appleButton = (
        <Action
          label={link ? strings.linkApple : strings.apple}
          onPress={() => signIn("apple")}
          pending={action.pending}
          secondary
          testID="apple-sign-in"
        />
      );
    }
  }

  return (
    <View style={{ gap: 16 }}>
      <Failure code={action.error} />
      {providers.includes("google") ? (
        <Action
          label={link ? strings.linkGoogle : strings.google}
          onPress={() => signIn("google")}
          pending={action.pending}
          secondary
          testID="google-sign-in"
        />
      ) : null}
      {appleButton}
    </View>
  );
};
