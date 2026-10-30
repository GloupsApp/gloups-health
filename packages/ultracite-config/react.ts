import base from "@gloups/ultracite-config/oxlint/base";
import { defineConfig } from "oxlint";
import react from "ultracite/oxlint/react";

export default defineConfig({
  env: { browser: true, node: false },
  extends: [base, react],
  ignorePatterns: base.ignorePatterns,
  settings: base.settings,
});
