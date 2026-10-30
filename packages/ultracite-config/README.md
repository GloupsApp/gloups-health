# Ultracite configuration

`@gloups/ultracite-config` owns reusable lint and format profiles. Workspaces declare it as a `workspace:*` development dependency and select only the profiles for their framework.

| Export                | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `oxlint/base`         | Ultracite core and anti-slop rules; Node tooling and API |
| `oxlint/react`        | Base plus React and hooks rules; Expo and UI             |
| `oxfmt`               | Shared Ultracite formatting                              |
| `eslint/nestjs`       | Ultracite NestJS syntax and type-aware rules             |
| `eslint/react-native` | Ultracite React Native rules; Expo and universal UI      |

Run `bun run check` at the root. It runs Ultracite's Oxlint/Oxfmt checks, the ESLint framework checks, and the full strict Nest doctor gate. `bun run fix` applies formatting and lint fixes; `bun run lint:frameworks` runs the framework checks alone. The root scripts also work through `bunx turbo run check` and `bunx turbo run fix`. Fixes are never cached.

Oxlint uses the nearest config alone. Workspace profiles inherit the base presets and explicitly retain environment, ignore patterns, and settings. React rules are not applied to the API, contracts, or tooling. The API's decorated-module allowance is local to its Nest entry point and module files. Army's sequential-test allowances stay local to the root test paths.

Ultracite 8.1.0 has no implemented NestJS or React Native rules in its Oxlint framework presets. The complementary ESLint command therefore runs the real Ultracite framework presets on API, mobile, and UI source. It does not repeat shared core rules. Keep both commands in the root check and pre-commit flow; running only a placeholder framework preset would omit coverage.

The Nest profile uses the plugin's supported no-Swagger configuration because Zod owns the generated HTTP contract. Endpoint paths retain kebab-case checks but are not required to be plural resource names. The full doctor gate owns admission checks because the ESLint guard rule cannot recognize `@Public()`; all built-in doctor checks remain enabled, without suppressions. The API config supplies an absolute source glob so provider-registration analysis also works when invoked from the root or an editor.

The React Native profile recognizes the shared `Heading` as a Text component. Colour literals belong in the UI token module rather than screen styles. Framework-specific findings fail at error severity, and the command rejects warnings too.
