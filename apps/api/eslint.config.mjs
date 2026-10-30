import { fileURLToPath } from "node:url";

import nestjs from "@gloups/ultracite-config/eslint/nestjs";

const files = ["src/**/*.ts"];

export default [
  ...nestjs.map((preset) => ({ ...preset, files })),
  {
    files,
    rules: {
      "@darraghor/nestjs-typed/injectable-should-be-provided": [
        "error",
        {
          filterFromPaths: ["dist", "node_modules", ".test.", ".spec."],
          src: [fileURLToPath(new URL("src/**/*.ts", import.meta.url))],
        },
      ],
    },
  },
];
