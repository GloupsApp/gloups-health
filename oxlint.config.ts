import base from "@gloups/ultracite-config/oxlint/base";
import { defineConfig } from "oxlint";

export default defineConfig({
  env: base.env,
  extends: [base],
  ignorePatterns: base.ignorePatterns,
  overrides: [
    {
      files: ["e2e/api/**/*.ts"],
      rules: {
        "eslint/no-await-in-loop": "off",
        "unicorn/no-await-expression-member": "off",
      },
    },
  ],
  settings: base.settings,
});
