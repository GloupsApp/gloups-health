# Gloups

The GLO-5 account slice runs one NestJS API and an Expo iOS/Android client. It supports email/password registration, verification, sign-in, password reset, a protected account round trip, persisted sessions, and sign-out.

## Run locally

Use Node `26.12.1`, Bun `1.4.4`, and Docker. From the repository root, for a fresh checkout (skip `local:setup` when `.env.local` already exists):

```sh
bun install --frozen-lockfile
bun run local:setup
docker compose -p gloups-glo5 --env-file apps/api/.env.local -f apps/api/compose.local.yaml up -d --wait
bun run api:build
bun run api:db:migrate
```

Run `bun run api:start` and `bun run api:mail-sink` in separate terminals. Run `bun run mobile:dev` for Metro, then open a native development build. Configuration examples are in `apps/api/.env.example` and `apps/mobile/.env.example`. Setup creates secrets in ignored files and refuses to overwrite existing configuration.

The API uses port 4345, PostgreSQL 25445, and the synthetic inbox 4346. A physical phone needs a reachable API URL. An Android emulator can use `adb reverse tcp:4345 tcp:4345` with the default URL, or `http://10.0.2.2:4345`.

The local inbox accepts only `@example.test` addresses. Its authenticated `GET /messages` returns verification/reset URLs; use the `EMAIL_DELIVERY_TOKEN` from the ignored API environment as a bearer credential. It keeps messages in memory and never sends mail to people. Open a verification URL to verify the email, then sign in. Reset links return to `gloups-health://reset-password`.

Production requires HTTPS for the API and email delivery endpoint, a strong `AUTH_SECRET`, and a configured `EMAIL_DELIVERY_TOKEN`. `EMAIL_DELIVERY_URL` is an authenticated server-side delivery boundary: it receives `{ recipient, kind, url }` and must return `{ accepted: true }` only after accepting delivery. Configure a transactional delivery service there. Better Auth deliberately returns a generic password-reset response even when delivery fails; the adapter emits `AUTH_EMAIL_DELIVERY_FAILED` without identifiers or secret URLs. Verification and reset sends are throttled and can be retried.

## Boundaries and contracts

`apps/api/src/modules/identity-access` is organized by business capability. `authentication` owns Better Auth integrations and session/HTTP ports; `accounts` owns the Gloups model, separate read/write ports, `commands` and `queries`, controller, and Drizzle repository. Small features stay flat and use familiar Nest component names. A capability module constructs its plain services with factory providers; architectural layers do not require separate folders or modules. No account-deletion scaffold is created before that capability is implemented.

Nest CQRS dispatches Gloups-owned operations. The root registers `CqrsModule.forRoot()` once. `ResolveAccountCommand` verifies the session and provisions the Gloups binding through a thin command handler and plain `ResolveAccountService`. `GetCurrentAccountQuery` then reads through a thin query handler and plain `GetCurrentAccountService`, which receives only `AccountReader`. The same database supports both ports; queries never provision missing accounts. Messages and business services have no Nest dependency, so buses use explicit result types instead of Nest base classes. Better Auth continues to own its authentication HTTP protocol. This slice needs no domain events or sagas.

Public entry points define cross-feature access. Authentication exports only its session and HTTP provider tokens; its SDK engine stays private. Accounts exports no Nest providers. The shared database runtime is available only to repositories, integrations, and approved wiring. A database unique constraint and conflict-safe transaction still bind each auth identity to one immutable Gloups UUID, including concurrent first requests.

`apps/api/AGENTS.md` records the convention. `tools/architecture-policy.ts` explicitly registers each source file’s feature, responsibility, public symbols, permitted Nest exports, and approved framework modules. `check:boundaries` validates these contracts, framework-independent models/messages/ports/operations, query access to read ports, ORM/SDK confinement, and acyclic source and Nest module dependencies. It resolves public re-exports and dynamic module factories without executing the application. Regression fixtures cover forbidden dependencies, query imports of writes, direct repository access from handlers, source/module cycles, broad exports, and unreviewable metadata. Folder names grant no permissions.

`GET /api/me` accepts no owner selector. The server verifies the session and email before resolving the account. Unknown query parameters fail with `INVALID_REQUEST`. Successful responses and application errors are validated with Zod. Auth endpoints use Better Auth's own validated protocol; the HTTP bridge adds a stable throttle code and standard `Retry-After` header.

`packages/contracts` owns the runtime schemas. `bun run contracts:generate` exports OpenAPI 3.1 and generates the TypeScript SDK with Hey API and Zod response/request validators. The owned client wrapper validates error payloads too. Expo sends cookies from Better Auth's dedicated Expo client using `credentials: "omit"`; SecureStore holds session credentials. Foreground checks revalidate with the server, account changes discard stale requests, and sign-out clears local credentials even if remote revocation cannot be confirmed.

Authored code inherits the strict TypeScript baseline. The API skips vendor declaration checking because the pinned Better Auth/Drizzle declarations reference optional database drivers and contain incompatible declaration signatures. Generated Hey API runtime code has a separate compiler project with only `exactOptionalPropertyTypes` disabled; the generated runtime explicitly assigns `undefined` to optional fields. These exceptions do not apply to authored logic. Ultracite ignores generated vendor code through its existing preset.

## Verify

```sh
bun run check
bun run check:boundaries
bun run contracts:check
bun run api:build
bun run test:cqrs
bun run mobile:build
bun run test:integration
```

CI runs these gates with the pinned Node/Bun versions. The existing root build also includes Blume, whose content directory is currently absent; this slice leaves that docs workspace unchanged. Integration acceptance starts its own disposable PostgreSQL 18.6 container, applies reviewed Drizzle migrations, and launches the compiled API using Node. It exercises verification, two-account isolation, invalid requests, concurrent provisioning, persistence across API/database restarts, recovery, revocation, sign-out, expiry, delivery failure, throttling, and malformed response/error contracts. Cleanup removes only its own container and volume.

CQRS validation passes all 34 architecture fixtures, a compiled Nest application-context test, and all nine HTTP/PostgreSQL acceptance checks. The bus test checks handler discovery, rejection of unauthenticated and unverified commands before writes, identity-scoped reads, and read-only queries even when a binding is missing. HTTP acceptance also checks that invalid input is rejected before provisioning. `test:cqrs` runs this compiled bus test in CI.

The pinned combination is NestJS/common/core/platform-node `12.3.0`, Nest CQRS `12.1.2`, Better Auth/Expo/Drizzle adapter `1.7.14`, Drizzle ORM `0.45.4`, Drizzle Kit `0.31.11`, postgres.js `3.4.9`, PostgreSQL `18.6` (image digest in Compose), Zod `4.6.7`, Hey API `0.99.0`, and Node `26.12.1`. Expo remains `58.0.20` with its compatible native modules.

Army's `e2e` runner is pinned at `0.21.3` and its mobile engine at `0.12.4`. `bun run test:mobile:ios` and `bun run test:mobile:android` run the registration/verification/account/relaunch/sign-out journey with generated synthetic credentials. Start the local API, inbox, and Metro on port 8085 first, and install the native build (`expo run:ios --no-bundler` or `expo run:android --no-bundler`). Set `GLO5_IOS_DEVICE` or `GLO5_ANDROID_DEVICE` to select an available test device. The default devices are `Gloups GLO-5 iPhone` and `emulator-5560`; the tests never erase a device or reset its keychain. The iOS fixture expects the simulator's default password AutoFill prompts. For Android, reverse port 8081 to Metro 8085 as well as the API port. Army reports and traces are ignored under `e2e/mobile/.e2e`.

Verified locally on 30 October 2026 after the feature reorganization: all 24 architecture fixtures and nine HTTP/PostgreSQL acceptance checks passed, and the Army journey passed on an iPhone 17e simulator (iOS 27.0, 46.60 seconds) and a Pixel 8 emulator (Android API 37, 11.87 seconds). Both native debug builds and both release bundle exports also succeeded during GLO-5 validation. Native acceptance exercised the dedicated Better Auth Expo client, SecureStore persistence across app restarts, and the generated feature client against the running API. Email acceptance used the synthetic inbox. The journey handles native permission prompts, iOS password suggestions and save-password dialogs, and the system confirmation when returning from a verification link. The refactor leaves HTTP contracts, SQL migrations, authentication policy, and readiness semantics unchanged.
