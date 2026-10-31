import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

import { execute, startHarness, waitFor } from "@e2e/api/harness";

const [target] = process.argv.slice(2);

if (target !== "ios" && target !== "android") {
  throw new Error("Choose ios or android");
}

const harness = await startHarness({
  apiPort: 4345,
  mailPort: 4346,
  providers: true,
});

const environment = {
  ...process.env,
  CI: "1",
  EMAIL_DELIVERY_TOKEN: harness.mailToken,
  EXPO_PUBLIC_API_URL: harness.url,
  GLOUPS_PROVIDER_FIXTURE: "1",
};

const metro = spawn(
  process.execPath,
  ["node_modules/expo/bin/cli", "start", "--port", "8085"],
  {
    cwd: fileURLToPath(new URL("../apps/mobile", import.meta.url)),
    env: environment,
    stdio: "inherit",
  }
);

try {
  await waitFor(async () => {
    const response = await fetch("http://127.0.0.1:8085/status");

    return response.ok;
  });

  if (target === "android") {
    const device = process.env["GLO5_ANDROID_DEVICE"] ?? "emulator-5560";
    await execute("adb", [
      "-s",
      device,
      "shell",
      "am",
      "force-stop",
      "com.android.chrome",
    ]);
    await execute("adb", [
      "-s",
      device,
      "shell",
      "am",
      "force-stop",
      "health.gloups.mobile",
    ]);

    const preferencesPath = "shared_prefs/health.gloups.mobile_preferences.xml";
    let preferencesXml: string;

    try {
      const existing = await execute("adb", [
        "-s",
        device,
        "shell",
        "run-as",
        "health.gloups.mobile",
        "cat",
        preferencesPath,
      ]);

      preferencesXml = existing.stdout;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("No such file or directory")
      ) {
        throw error;
      }

      preferencesXml = '<?xml version="1.0" encoding="utf-8"?><map></map>';
    }

    if (!preferencesXml.includes("</map>")) {
      throw new Error("Could not read the Android debug preferences");
    }

    preferencesXml = preferencesXml
      .replaceAll(/<string name="debug_http_host">[^<]*<\/string>/gu, "")
      .replace(
        "</map>",
        '<string name="debug_http_host">127.0.0.1:8085</string></map>'
      );

    // Configure only the dedicated debug app's Metro preference, preserving its credentials.
    const preferences = spawn(
      "adb",
      [
        "-s",
        device,
        "shell",
        "run-as",
        "health.gloups.mobile",
        "tee",
        preferencesPath,
      ],
      { stdio: ["pipe", "ignore", "inherit"] }
    );

    preferences.stdin.end(preferencesXml);
    const [preferencesCode] = await once(preferences, "exit");

    if (preferencesCode !== 0) {
      throw new Error(
        "Could not configure the Android debug app's Metro address"
      );
    }

    await execute("adb", ["-s", device, "reverse", "tcp:4345", "tcp:4345"]);
    await execute("adb", ["-s", device, "reverse", "tcp:8081", "tcp:8085"]);
    await execute("adb", ["-s", device, "reverse", "tcp:8085", "tcp:8085"]);
    await execute("adb", [
      "-s",
      device,
      "shell",
      "am",
      "start",
      "-a",
      "android.intent.action.VIEW",
      "-d",
      "gloups-health://?__expo_url=http%3A%2F%2F127.0.0.1%3A8085",
      "health.gloups.mobile",
    ]);
  }

  const runner = spawn(process.execPath, ["tools/run-mobile.ts", target], {
    env: environment,
    stdio: "inherit",
  });

  const [code] = await once(runner, "exit");
  process.exitCode = code ?? 1;

  if (process.exitCode !== 0) {
    process.stderr.write(harness.diagnostics());
  }
} finally {
  metro.kill("SIGTERM");
  await harness.close();
}
