import parser from "@typescript-eslint/parser";
import type { Linter } from "eslint";
import reactNative from "ultracite/eslint/react-native";

const profile: readonly Linter.Config[] = [
  {
    languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  ...reactNative,
  {
    rules: {
      "react-native/no-raw-text": ["error", { skip: ["Heading"] }],
    },
  },
];

export default profile;
