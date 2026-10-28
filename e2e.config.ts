import type { E2EConfig } from "e2e";

export default {
  output: ".e2e",
  retries: 0,
  targets: [{ name: "api", platform: "api" }],
  tests: "e2e/api/**/*.e2e.ts",
  timeout: 30_000,
  workers: 1,
} satisfies E2EConfig;
