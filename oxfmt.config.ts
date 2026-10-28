import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    "**/.blume",
    "**/.agents",
    "**/.husky/_",
  ],
  proseWrap: "preserve",
});
