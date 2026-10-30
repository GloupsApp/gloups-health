import parser from "@typescript-eslint/parser";
import reactNative from "ultracite/eslint/react-native";

export default [
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
