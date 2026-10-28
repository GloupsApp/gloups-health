# Expo SDK 58 foundation verification

Scope: [TOOL-003](../tasks/TOOL-003-expo-foundation.md). The owner's request
approves Expo SDK 58, TypeScript configuration and Ultracite integration.
Assignment [PR #9](https://github.com/GloupsApp/gloups-health/pull/9) merged at
`39624aa7ea008ed4bd6e25a444966ac0c9e29b10` and was read back from `origin/main`
before implementation on `codex/tool-003-expo-foundation`.

Checks ran on macOS arm64 with Node.js `26.12.1` and Bun `1.4.4` from
`/tmp/gloups-tooling-20261028/bun-1.4.4`, first on PATH. The global Bun remains
unchanged. Commands ran from the worktree root. The implementation commit and PR
are recorded in the packet's handoff.

## Scaffold and dependency compatibility

The official scaffold was generated in a task-owned temporary directory using:

```sh
bunx create-expo-app@5.0.0 /tmp/gloups-expo-sdk58-template-20261028 \
  --template expo-template-blank-typescript@58.0.29 \
  --no-install --no-agents-md --yes
```

The mobile workspace retains the template's entry registration and SDK-compatible
dependencies. It has an empty `View` under `src/`. Demo text, template artwork and
the unused status-bar dependency were omitted. The existing scoped instructions
were preserved and updated for the actual shell. No product flow or palette was
introduced.

| Direct mobile dependency | Exact version |
| ------------------------ | ------------- |
| expo                     | 58.0.20       |
| expo-system-ui           | 58.0.6        |
| react                    | 19.3.0        |
| react-native             | 0.88.0        |
| @types/react             | 19.3.0        |
| typescript               | 6.0.3         |

Expo's installed `bundledNativeModules.json` recommends React Native `0.88.0`.
`expo-system-ui` supports the configured automatic native appearance on Android.
Packages were checked/installed through Expo CLI with `--bun` and explicit
versions; the single root `bun.lock` contains the workspace resolution.

```sh
bun run --cwd apps/mobile expo install expo@58.0.20 react@19.3.0 react-native@0.88.0 --bun
bun run --cwd apps/mobile expo install expo-system-ui@58.0.6 --bun
bun run --cwd apps/mobile expo install @types/react@19.3.0 typescript@6.0.3 --dev --bun
bun install --frozen-lockfile
bun run --cwd apps/mobile expo install --check
bun run --cwd apps/mobile expo config --type public --json
bunx expo-doctor@1.21.5 apps/mobile
```

Results: frozen installation made no dependency changes; Expo reported
"Dependencies are up to date"; public config resolves SDK `58.0.0` with only
`ios` and `android` platforms; Expo Doctor passed `20/20` checks. No EAS project,
native application identifier, credentials or service connection was configured.

## TypeScript and lint configuration

Mobile extends `expo/tsconfig.base` and then `../../tsconfig.base.json`.
Effective settings retain Expo's `react-jsx` mode and `react-native` condition,
the shared ES2022 target/ES2023 library, bundler resolution and every authored-code
safety setting. React runtime types and the entry/source scope are explicit.
Root tooling, docs and mobile participate in `bun run typecheck`.

The first typecheck with declaration checking enabled failed exclusively in
React Native `0.88.0`'s generated declarations:

| Dependency declaration                                                      | Diagnostic                                                                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `types_generated/Libraries/Animated/nodes/AnimatedProps.d.ts:19`            | TS2411: optional `style` includes `undefined`, which the string index type excludes                                                |
| `types_generated/Libraries/Lists/VirtualizedList.d.ts:17`                   | TS2344: `typeof VirtualizedList` fails React's `ElementType` constraint because `getDerivedStateFromProps` requires narrower props |
| `types_generated/src/private/webapis/dom/nodes/ReactNativeDocument.d.ts:29` | TS2416: `textContent: null` conflicts with `ReadOnlyNode.textContent: string`                                                      |

Reproduction:

```sh
bun run tsc --project apps/mobile/tsconfig.json --skipLibCheck false
```

The dependency source and installed SDK recommendation were inspected. Authored
mobile checking succeeded with `--skipLibCheck`. Mobile therefore has its own
documented `skipLibCheck: true` exception, matching Expo's default for published
declarations. The root baseline remains `false`; the existing docs exception is
separate. Neither exception propagates to another project. Remove the mobile
override when a compatible dependency update passes the reproduction command.
This exception leaves dependency declaration consistency unchecked.

```sh
bun run tsc --project apps/mobile/tsconfig.json --showConfig
bunx ultracite fix
bunx ultracite check
bunx ultracite doctor
bun run build
```

Results: formatting/lint checks passed. The root config extends Ultracite core,
React and anti-slop presets; Oxfmt remains the formatter. Ultracite Doctor
reported `8 passed, 0 warnings, 0 failed`. The build's root compiler check and
both workspace typechecks passed with the documented declaration exceptions.

## Build and development boundaries

```sh
bun run turbo run build --dry=json
bun run build
bun run mobile:dev --help
bun run mobile:ios --help
bun run mobile:android --help
```

The actual graph has docs and mobile build/typecheck tasks. Each build depends
on its workspace typecheck, including filtered root build commands. Root scripts
forward Expo CLI options through Turborepo; all three mobile help commands passed.

The full build passed. Blume produced its existing local static site. Metro
exported an Android Hermes bundle (`613` modules, about `1.6 MB`) and an iOS Hermes
bundle (`615` modules, about `1.5 MB`) into ignored `apps/mobile/dist/`.
`metadata.json` identifies exactly those two platforms. Expo's default Metro and
Babel configuration handled the Bun monorepo without custom resolver settings.

`CI=1 bun run mobile:dev` started the actual root development task on reserved
port `8083`. `/status` returned HTTP `200` with `packager-status:running`.
Platform-specific Expo manifests advertised development bundle URLs that returned
HTTP `200`: `3,935,588` bytes for iOS and `3,942,692` bytes for Android. These
requests used the live Metro server, not the exported bundles. The owned process
was stopped through its terminal, and an IPv6 bind confirmed the port was free.
An additional `--localhost` run served status on IPv6 but advertised a bundle
address the probe could not reach; the default root development command passed.

The shell has no product journeys. No simulator, emulator, physical device or
E2E Army journey was run. Local inventory showed shutdown regular iPhone
simulators on iOS 27.0, no available iPhone Duo, and no connected Android device.
No existing simulator was consumed. Bundle exports and HTTP bundle responses
establish compiler/bundler behavior only; they do not establish native launch,
device layout, permissions, health imports or background behavior.

## Repository checks and limitations

The existing ignore rules cover `node_modules`, mobile `dist`, `.expo`, generated
`ios`/`android` directories and environment files. `git check-ignore` confirmed
each category. No extra lockfile, generated native project, credential, health
record or identity token was added. An empty Changeset records repository setup
without changing package versions; `bun run changeset:status` reports only the
pre-existing pending documentation patch.

Review uses the actual diff, including new files, scope/status consistency and
secret/reference exclusions. All `206` local Markdown targets and referenced
anchors passed, as did `git diff --check`. GitHub Actions are
unavailable and were not used. Agents wrote no unit tests or TDD. Native
acceptance, product design, domain contracts, provider setup and distribution
remain separate work.

Sources: [Expo SDK 58 release](https://expo.dev/changelog/sdk-58),
[create-expo-app](https://docs.expo.dev/more/create-expo/),
[Expo TypeScript](https://docs.expo.dev/guides/typescript/),
[Expo monorepos](https://docs.expo.dev/guides/monorepos/) and the installed
versioned template, SDK configuration and React Native declarations.
