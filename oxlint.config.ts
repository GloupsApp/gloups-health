import antiSlop from "eslint-plugin-anti-slop";
import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core],
  ignorePatterns: [...core.ignorePatterns, "**/.blume", "**/.agents"],
  jsPlugins: [{ name: "anti-slop", specifier: "eslint-plugin-anti-slop" }],
  rules: antiSlop.configs.recommended.rules,
});
