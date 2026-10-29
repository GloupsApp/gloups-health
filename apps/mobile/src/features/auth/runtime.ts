import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { z } from "zod";

const originSchema = z.url().refine((value) => {
  const url = new URL(value);

  return (
    !url.username &&
    !url.password &&
    url.pathname === "/" &&
    !url.search &&
    !url.hash &&
    (url.protocol === "https:" || (__DEV__ && url.protocol === "http:"))
  );
});

const runtimeConfiguration = z
  .object({ apiOrigin: z.string() })
  .parse(Constants.expoConfig?.extra?.["gloupsAuth"]);

const configuredOrigin = runtimeConfiguration.apiOrigin;

const localOrigin =
  process.env.EXPO_OS === "android"
    ? "http://10.0.2.2:4340"
    : "http://127.0.0.1:4340";

export const apiOrigin = originSchema
  .parse(configuredOrigin || (__DEV__ ? localOrigin : ""))
  .replace(/\/$/u, "");

export const authEnvironment = "local";
export const cookiePrefix = "gloups-health-local";
export const storagePrefix = "gloups-health-auth-local-v1";
export const authScheme = "gloups-health";
export const expoOrigin = `${authScheme}://`;

export const authCallback = (flow: "verification" | "social" = "social") =>
  Linking.createURL("/auth/callback", { queryParams: { flow } });

export const resetCallback = () => Linking.createURL("/reset-password");
