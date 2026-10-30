# TypeScript configuration

Every workspace declares `@gloups/typescript-config` as a `workspace:*` development dependency and extends a preset by package name. The package contains configuration only; it has no build task.

| Preset                      | Consumer                                                                |
| --------------------------- | ----------------------------------------------------------------------- |
| `base.json`                 | Strict defaults shared by all presets                                   |
| `node.json`                 | Root tooling and Node scripts                                           |
| `nestjs.json`               | API; adds legacy decorators and emitted metadata                        |
| `expo.json`                 | Mobile; combines Expo's compiler configuration with our strict baseline |
| `library.json`              | Contracts; emits JavaScript, declarations, and declaration maps         |
| `react-library.json`        | React packages; adds JSX and React types                                |
| `react-native-library.json` | Universal React Native/React Native Web UI                              |

Keep `include`, output directories, and application aliases in the consuming workspace. Root test/tool aliases stay in `tsconfig.paths.json`; they are not part of a reusable compiler preset. API and contracts aliases remain local so `tsc-alias` can rewrite compiled ESM correctly.

Do not relax the strict baseline to match a starter template. Vendor declaration checking remains skipped only in the framework presets and tooling workspace that require it. Contracts check vendor declarations and their generated compiler project retains its documented `exactOptionalPropertyTypes` exception.

Expo is an optional peer needed only by consumers of `expo.json`. The package does not depend on any application workspace, so the workspace graph stays acyclic.
