# Mobile foundation

This workspace contains the Expo SDK 58 startup shell approved in
[TOOL-003](../../docs/tasks/TOOL-003-expo-foundation.md). It registers an empty
React Native root. Product screens and service connections need their own packets.

Run commands from the repository root with Bun 1.4.4:

```sh
bun install --frozen-lockfile
bun run mobile:dev
bun run mobile:ios
bun run mobile:android
bun run mobile:build
bun run typecheck
bun run check
```

The development commands share Metro port `8085`; start one at a time. `mobile:ios`
and `mobile:android` ask Expo CLI to open an available local simulator/emulator
or connected device. Expo Go must support SDK 58. These commands do not create an
EAS project, sign an app or register a permanent application identifier.

`mobile:build` exports JavaScript bundles for iOS and Android to ignored `dist/`.
It checks types first through Turborepo. An export does not build a native binary
or establish device acceptance. Record native journeys under
[verification](../../docs/verification/README.md).

The compiler inherits Expo's runtime settings followed by the shared strict
baseline. Mobile scope and React types are explicit. This project alone sets
`skipLibCheck: true`: React Native 0.88.0 publishes three declaration errors under
the shared strict settings. Authored code retains every strict check. Recheck
with `bun run tsc --project apps/mobile/tsconfig.json --skipLibCheck false` from
the repository root after a compatible dependency update; the
[verification record](../../docs/verification/2026-10-28-expo-foundation.md)
records the diagnostics.
Root Ultracite configuration supplies core, React and anti-slop lint rules and
Oxfmt formatting. Expo's built-in Metro and Babel configuration handles the Bun
monorepo; custom bundler configuration is unnecessary for this shell.

Authored app code lives under `src/`; `index.ts` only registers it. A future Router
packet should keep routes under `src/app/` and screen bodies outside the route
tree. Follow scoped [AGENTS](AGENTS.md),
[I18N](../../docs/I18N.md) and [DESIGN](../../docs/DESIGN.md) before product UI work.

This review checkpoint adds official auth transport, SecureStore generation
ownership and a separate language preference. It retains the foundation shell
entry; Router screens arrive in following PRs. Typechecks/exports do not establish
credential, provider or real-device acceptance. The dependency/script manifest
records the actual available commands for this checkpoint.
