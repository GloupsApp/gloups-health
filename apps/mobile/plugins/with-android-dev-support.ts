import { withMainApplication } from "expo/config-plugins";
import type { ConfigPlugin } from "expo/config-plugins";

// Expo's factory defaults to the prebuilt React library's release flag.
// Use the application's flag so debug builds can actually connect to Metro.
const withAndroidDevSupport: ConfigPlugin = (config) =>
  withMainApplication(config, (application) => {
    const source = application.modResults.contents;

    if (source.includes("useDevSupport = BuildConfig.DEBUG")) {
      return application;
    }

    const anchor = "context = applicationContext,";

    if (!source.includes(anchor)) {
      throw new Error("Review the Android React host template before building");
    }

    application.modResults.contents = source.replace(
      anchor,
      `${anchor}\n      useDevSupport = BuildConfig.DEBUG,`
    );

    return application;
  });

export default withAndroidDevSupport;
