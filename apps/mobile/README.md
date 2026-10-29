# Gloups authentication app

AUTH-003 replaces the empty SDK 58 shell with Expo Router credential, recovery,
social, method-management and deletion screens. It uses official Better Auth
1.7.14 / Expo integrations, SecureStore, AppleAuthentication and native controls.
The source is under review; provider and complete device acceptance are pending.

Run workspace commands from the repository root with Bun 1.4.4:

```sh
bun install --frozen-lockfile
bun run mobile:dev
bun run mobile:build
bun run typecheck
bun run check
```

Metro uses port `8085`. Start one server for this lane. `mobile:ios` and
`mobile:android` open an available device, so use explicit assigned devices for
acceptance. Expo Go must support SDK 58. Its shared application identity cannot
establish the Gloups custom scheme or native Apple capability.

Local debug builds use installed Xcode/Android tooling. Generated `ios/` and
`android/` directories and build outputs remain ignored. These commands do not
create an EAS project, register an app or distribute a store build:

```sh
bun run --filter @gloups/mobile native:ios --help
bun run --filter @gloups/mobile native:android --help
bun run --filter @gloups/mobile native:ios --device <assigned-UDID> --port 8085
bun run --filter @gloups/mobile native:android --device <assigned-serial> --port 8085
```

Use `--port 8085` with the existing Metro server; Expo CLI rejects combining
`--port` and `--no-bundler`. The native identity is the source-verified
`app.gloups.health`, with scheme `gloups-health`. Live Apple testing still needs
its authorized service inventory/capability and physical iPhone.

## API and session boundary

Start the isolated API/Postgres/email sink using [API setup](../api/README.md).
Development defaults are `http://127.0.0.1:4340` on iOS and
`http://10.0.2.2:4340` on Android. An explicit `EXPO_PUBLIC_API_URL` sets the public
API origin at bundle/config time; it contains no secret. Release configuration
requires HTTPS. Actual release/service policy is not yet approved.

`src/app/` contains route composition only. `src/features/auth/` owns screens,
wire validation, generation lifetimes and native adapters; it imports no API
source. Only a server-revalidated authenticated state contains an AccountView.
Start and foreground checks verify the official session and `/api/me`; offline,
unavailable and unverified states grant no protected UI.

The official Expo client uses an environment-specific SecureStore adapter with
session-data caching disabled. Retirement closes requests/writes, clears its
owned keys and precedes activation of another generation. Online sign-out sends
one captured credential for remote revocation; offline/failure clears local
access and reports an unconfirmed result. No credential retry queue exists.

Google and Android Apple use browser OAuth; iOS Apple uses the official native
sheet and verified code/nonce bridge. Callback query cookies are never imported
by application code. The official Expo plugin handles the owned browser flow;
a cold callback revalidates existing stored proof or requires starting again.
Token-bearing reset/verification navigation parameters are cleared promptly.

English/French catalogs are complete. The explicit UI language is a device
preference separate from credentials; supported device locale order supplies its
initial default. Signup records the bounded email language; social creation
carries the same preference through server-controlled OAuth state/native context.
Language never selects country, region, units or timezone.

## Verification

`mobile:build` exports JavaScript bundles to ignored `dist/`; it establishes no
native acceptance. Use the official TesterArmy runner with the actual local API
and only the assigned devices in `e2e.config.ts`. `GLOUPS_AUTH003_NATIVE=1` selects
the installed Gloups binary. Go runs retain the shared Expo bundle IDs.

```sh
bun run e2e:mobile
GLOUPS_AUTH003_NATIVE=1 bun run e2e:mobile
```

Read [native cases and limitations](../../e2e/mobile/authentication.md) before
running: the suite owns only this packet's synthetic service/device state.
Passwords use Army Secret handles; private one-time URLs bypass recorded runner
arguments and stay in memory. Reports, credentials and captures stay ignored.
No unit tests, TDD, model calls or cloud upload are involved.

Strict authored-code checks remain enabled. The existing mobile-only
`skipLibCheck` exception covers published React Native declarations; its removal
condition and diagnostics remain in [CODE-STANDARDS](../../docs/CODE-STANDARDS.md)
and [foundation evidence](../../docs/verification/2026-10-28-expo-foundation.md).
Expo's built-in Metro/Babel handling supports this Bun monorepo without a custom
bundler configuration. Follow scoped [AGENTS](AGENTS.md) for ongoing work.
