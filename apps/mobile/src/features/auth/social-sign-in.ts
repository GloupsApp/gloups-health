import { z } from "zod";

import { AuthFailureError, sdkFailure } from "./errors";
import { completeNativeApple } from "./native-apple";
import { authCallback } from "./runtime";
import type { SessionGeneration } from "./session-generation";

interface SocialSessionAccess {
  beginAccountChange: () => Promise<void>;
  refresh: () => Promise<void>;
  run: <T>(work: (generation: SessionGeneration) => Promise<T>) => Promise<T>;
}

const methodsSchema = z.array(z.object({ providerId: z.string() }));

export const createSocialSignIn = (access: SocialSessionAccess) => {
  const signIn = async (provider: "google" | "apple"): Promise<void> => {
    await access.beginAccountChange();
    await access.run(async (generation) => {
      if (provider === "apple" && process.env.EXPO_OS === "ios") {
        await completeNativeApple(generation, "sign-in");
      } else {
        const result = await generation.client.signIn.social({
          callbackURL: authCallback(),
          errorCallbackURL: authCallback(),
          provider,
        });

        if (result.error) {
          throw sdkFailure(result.error);
        }

        const session = await generation.client.getSession({
          query: { disableCookieCache: true },
        });

        if (session.error) {
          throw sdkFailure(session.error);
        }

        if (session.data) {
          generation.acceptPrincipal(session.data.user);
        }

        if (!session.data) {
          throw new AuthFailureError("cancelled");
        }
      }
    });
    await access.refresh();
  };

  return {
    async linkSignInMethod(provider: "google" | "apple"): Promise<void> {
      await access.run(async (generation) => {
        if (provider === "apple" && process.env.EXPO_OS === "ios") {
          await completeNativeApple(generation, "link");
        } else {
          const result = await generation.client.linkSocial({
            callbackURL: authCallback(),
            errorCallbackURL: authCallback(),
            provider,
          });

          if (result.error) {
            throw sdkFailure(result.error);
          }

          const accounts = await generation.client.listAccounts();

          if (accounts.error) {
            throw sdkFailure(accounts.error);
          }

          if (
            !methodsSchema
              .parse(accounts.data)
              .some((method) => method.providerId === provider)
          ) {
            throw new AuthFailureError("cancelled");
          }
        }
      });
      await access.refresh();
    },
    signInWithApple: () => signIn("apple"),
    signInWithGoogle: () => signIn("google"),
  };
};
