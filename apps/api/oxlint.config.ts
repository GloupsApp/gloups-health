import base from "@gloups/ultracite-config/oxlint/base";
import { defineConfig } from "oxlint";

export default defineConfig({
  env: base.env,
  extends: [base],
  ignorePatterns: base.ignorePatterns,
  overrides: [
    {
      files: ["src/main.ts", "src/**/*.module.ts"],
      rules: {
        "typescript/no-extraneous-class": [
          "error",
          { allowWithDecorator: true },
        ],
      },
    },
  ],
  settings: base.settings,
});
