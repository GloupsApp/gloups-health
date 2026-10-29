import { randomBytes } from "node:crypto";
import path from "node:path";

import { mobile } from "@e2e-dev/mobile";
import type { E2EConfig } from "e2e";

process.env["AGENT_DEVICE_STATE_DIR"] = path.resolve(
  ".e2e/agent-device-auth003"
);

process.env["GLOUPS_AUTH003_E2E_PASSWORD"] ??=
  randomBytes(24).toString("base64url");

process.env["GLOUPS_AUTH003_E2E_NEXT_PASSWORD"] ??=
  randomBytes(24).toString("base64url");

const nativeBuild = process.env["GLOUPS_AUTH003_NATIVE"] === "1";
const iosApp = nativeBuild ? "app.gloups.health" : "host.exp.Exponent";
const androidApp = nativeBuild ? "app.gloups.health" : "host.exp.exponent";

export default {
  output: ".e2e",
  retries: 0,
  secrets: {
    nextPassword: () => process.env["GLOUPS_AUTH003_E2E_NEXT_PASSWORD"] ?? "",
    password: () => process.env["GLOUPS_AUTH003_E2E_PASSWORD"] ?? "",
    shortPassword: () =>
      (process.env["GLOUPS_AUTH003_E2E_PASSWORD"] ?? "").slice(0, 14),
  },
  targets: [
    { name: "api", platform: "api" },
    {
      app: { bundleId: iosApp },
      engine: mobile({
        device:
          process.env["GLOUPS_AUTH003_IOS_UDID"] ??
          "Gloups AUTH-003 015e iPhone",
        platform: "ios",
        session: "gloups-auth003-015e-ios",
      }),
      name: "ios",
    },
    {
      app: { bundleId: iosApp },
      engine: mobile({
        device: "Gloups AUTH-003 015e Duo",
        platform: "ios",
        session: "gloups-auth003-015e-duo",
      }),
      name: "ios-duo",
    },
    {
      app: { bundleId: androidApp },
      engine: mobile({
        device: "Gloups_AUTH_003_015e",
        platform: "android",
        session: "gloups-auth003-015e-android",
      }),
      name: "android",
    },
  ],
  tests: "e2e/**/*.e2e.ts",
  timeout: 30_000,
  workers: 1,
} satisfies E2EConfig;
