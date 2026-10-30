import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";

const [target] = process.argv.slice(2);

if (target !== "ios" && target !== "android") {
  throw new Error("Choose ios or android");
}

const runner = spawn(
  process.execPath,
  [
    "node_modules/e2e/dist/cli/bin.js",
    "run",
    "--config",
    "e2e/mobile/config.ts",
    "--target",
    target,
  ],
  {
    env: {
      ...process.env,
      DO_NOT_TRACK: "1",
      E2E_USER_ADULT_PASSWORD: randomBytes(12).toString("hex"),
      E2E_USER_ADULT_USERNAME: `glo5-${randomBytes(6).toString("hex")}@example.test`,
    },
    stdio: "inherit",
  }
);

const [code] = await once(runner, "exit");

process.exitCode = code ?? 1;
