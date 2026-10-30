import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react, antiSlop],
  ignorePatterns: [...(core.ignorePatterns ?? []), "**/.blume"],
  overrides: [
    {
      files: ["apps/api/src/main.ts", "apps/api/src/**/*.module.ts"],
      rules: {
        "typescript/no-extraneous-class": [
          "error",
          { allowWithDecorator: true },
        ],
      },
    },
    {
      files: ["e2e/api/**/*.ts"],
      rules: {
        "eslint/no-await-in-loop": "off",
        "unicorn/no-await-expression-member": "off",
      },
    },
  ],
});
