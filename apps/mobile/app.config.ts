import type { ConfigContext, ExpoConfig } from "expo/config";

const appConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  android: {
    ...config.android,
    package: "app.gloups.health",
    softwareKeyboardLayoutMode: "resize",
  },
  extra: {
    ...config.extra,
    authEnvironment: "local",
    gloupsAuth: { apiOrigin: process.env["EXPO_PUBLIC_API_URL"] ?? "" },
  },
  ios: {
    ...config.ios,
    bundleIdentifier: "app.gloups.health",
    supportsTablet: false,
    usesAppleSignIn: true,
  },
  name: "Gloups",
  plugins: [
    "expo-router",
    "expo-dev-client",
    ["expo-secure-store", { configureAndroidBackup: true }],
    "expo-apple-authentication",
    "expo-web-browser",
    "expo-localization",
  ],
  scheme: "gloups-health",
  slug: "gloups-health",
});

export default appConfig;
