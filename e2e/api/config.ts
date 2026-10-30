import type { E2EConfig } from "e2e";

export default {
  cleanupTimeout: 30_000,
  output: ".e2e",
  retries: 0,
  targets: [{ name: "api", platform: "api" }],
  tests: ["*.e2e.ts"],
  timeout: 120_000,
  workers: 1,
} satisfies E2EConfig;
