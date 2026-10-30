import nestjsPlugin from "@darraghor/eslint-plugin-nestjs-typed";
import parser from "@typescript-eslint/parser";
import nestjs from "ultracite/eslint/nestjs";
import nestjsTypeAware from "ultracite/eslint/nestjs/type-aware";

// Oxlint already supplies shared rules. ESLint adds the framework rules that
// Ultracite's Oxlint NestJS preset does not implement.
export default [
  { languageOptions: { parser } },
  ...nestjs,
  ...nestjsTypeAware,
  // Zod owns our generated OpenAPI contract; this is the plugin's supported
  // profile for projects that do not use @nestjs/swagger DTO decorators.
  ...nestjsPlugin.configs.flatNoSwagger,
  {
    rules: {
      // The full doctor gate enforces guards or an explicit @Public policy.
      // This ESLint rule cannot recognize public routes and has no options.
      "@darraghor/nestjs-typed/api-methods-should-be-guarded": "off",
      "@darraghor/nestjs-typed/use-correct-endpoint-naming-convention": [
        "error",
        { caseFormat: "kebab-case", checkPluralization: false },
      ],
    },
  },
];
