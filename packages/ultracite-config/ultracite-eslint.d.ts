// Ultracite 8.1 ships these JavaScript presets without declarations. Describe
// only their public ESLint contract; authored composition is checked separately.
declare module "ultracite/eslint/nestjs" {
  import type { Linter } from "eslint";

  const profile: readonly Linter.Config[];
  export default profile;
}

declare module "ultracite/eslint/nestjs/type-aware" {
  import type { Linter } from "eslint";

  const profile: readonly Linter.Config[];
  export default profile;
}

declare module "ultracite/eslint/react-native" {
  import type { Linter } from "eslint";

  const profile: readonly Linter.Config[];
  export default profile;
}
