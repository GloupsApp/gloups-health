import { mobile } from "@e2e-dev/mobile";
import type { E2EConfig } from "e2e";

process.loadEnvFile(new URL("../../apps/api/.env.local", import.meta.url));

export default {
  actionTimeout: 30_000,
  assertionTimeout: 15_000,
  credentials: {
    adult: {
      password: process.env["E2E_USER_ADULT_PASSWORD"] ?? "",
      username: process.env["E2E_USER_ADULT_USERNAME"] ?? "",
    },
  },
  output: ".e2e",
  retries: 0,
  targets: [
    {
      app: {
        bundleId: "health.gloups.mobile",
        launchArguments: ["--initialUrl", "http://127.0.0.1:8085"],
      },
      engine: mobile({
        device: process.env["GLO5_IOS_DEVICE"] ?? "Gloups GLO-5 iPhone",
        platform: "ios",
      }),
      name: "ios",
    },
    {
      app: { bundleId: "health.gloups.mobile" },
      engine: mobile({
        device: process.env["GLO5_ANDROID_DEVICE"] ?? "emulator-5560",
        platform: "android",
      }),
      name: "android",
    },
  ],
  tests: ["*.e2e.ts"],
  timeout: 180_000,
  workers: 1,
} satisfies E2EConfig;
