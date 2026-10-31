import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

import type { SocialProvider } from "./auth-client";
import { loadProviders } from "./sign-in-methods";

const noLinkedProviders = [] as const;

export const providerName = (provider: string) => {
  if (provider === "credential") {
    return "Password";
  }

  return provider === "apple" ? "Apple" : "Google";
};

export const ProviderButtons = ({
  busy,
  linkedProviders = noLinkedProviders,
  linking = false,
  onPress,
}: {
  busy: boolean;
  linkedProviders?: readonly string[];
  linking?: boolean;
  onPress: (provider: SocialProvider) => void;
}) => {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void loadProviders()
      .then((available) => {
        if (active) {
          setProviders(available);
        }

        return null;
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <View>
      {providers
        .filter((provider) => !linkedProviders.includes(provider))
        .map((provider) => (
          <Button
            key={provider}
            disabled={busy}
            onPress={() => onPress(provider)}
            title={`${linking ? "Link" : "Continue with"} ${providerName(provider)}`}
          />
        ))}
      {failed && (
        <Text>
          Provider sign-in is temporarily unavailable. Use your password or try
          again later.
        </Text>
      )}
    </View>
  );
};
