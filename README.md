# Gloups

The GLO-5 account slice runs one NestJS API and an Expo iOS/Android client. It supports email/password registration, verification, sign-in, password reset, a protected account round trip, persisted sessions, and sign-out.

## Workspace packages

- [`@gloups/typescript-config`](packages/typescript-config/README.md) provides strict base, Node, NestJS, Expo, and library compiler presets. Each consumer declares a `workspace:*` development dependency and extends the appropriate preset by package name. Application aliases and output paths stay local; the presets contain no cross-application aliases.
- [`@gloups/ultracite-config`](packages/ultracite-config/README.md) provides shared Oxlint/Oxfmt configuration and real ESLint framework checks for NestJS and React Native. React rules apply only to mobile and UI. `bun run check` runs shared checks, framework checks, and the strict full doctor gate. The API uses the supported no-Swagger lint profile because Zod owns its HTTP contract.
- [`@gloups/ui`](packages/ui/README.md) provides the universal account heading and colour tokens used by Expo. React/React Native are peers; React Native Web is an optional peer for web consumers. Turbo builds UI before mobile, and `bun run ui:test:web` verifies its compiled export through the real web adapter.

Compiler and lint configuration are ordinary workspace dependencies, so Turbo includes them in the package graph. Shared configuration follows the [Turborepo TypeScript example](https://github.com/vercel/turborepo/tree/main/examples/with-nestjs/packages/typescript-config) and [Ultracite's workspace configuration guidance](https://www.ultracite.ai/docs/monorepos.md). `turbo run check` and `turbo run fix` expose the root lint flow without creating redundant per-package lint tasks. Mutating fixes are never cached.

[Changesets](.changeset/README.md) records shared-package changes and updates private package versions and internal dependencies. All workspaces remain private, with no npm publishing workflow. The included Changeset covers the new configuration and UI packages.

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

Nest CQRS dispatches Gloups-owned operations. The root registers `CqrsModule.forRoot()` once. `AccountAdmissionGuard` validates query input before dispatching `ResolveAccountCommand`, which verifies the session and provisions the Gloups binding through a thin command handler and plain `ResolveAccountService`. The guard attaches the admitted identity to that request using a private symbol. The controller fails closed without it, then dispatches `GetCurrentAccountQuery` through a thin query handler and plain `GetCurrentAccountService`, which receives only `AccountReader`. The same database supports both ports; queries never provision missing accounts. Messages and business services have no Nest dependency, so buses use explicit result types instead of Nest base classes. Better Auth continues to own its authentication HTTP protocol. This slice needs no domain events or sagas.

Public entry points define cross-feature access. Authentication exports only its session contract; its SDK engine and HTTP middleware stay private. Accounts exports no Nest providers. The capability graph uses static Nest module imports. Dynamic registration is reserved for actual options: `CqrsModule.forRoot()` and the official `@nestjs/drizzle` adapter's `DrizzleModule.forRootAsync()`. `ApiConfigModule` validates configuration once per application, and the Drizzle factory injects that contract to create and own its pool. The adapter closes the pool on shutdown. Repositories use `@InjectDrizzle`; Better Auth receives the connection through approved factory wiring. Although the framework token is global, the architecture gate restricts access to repositories, integrations, and wiring. Readiness checks run before HTTP listening and on every explicitly public `/healthz` request. A database unique constraint and conflict-safe transaction still bind each auth identity to one immutable Gloups UUID, including concurrent first requests.

Authored application imports use extensionless feature aliases, for example `import { ResolveAccountService } from "@accounts/commands/resolve-account.service"`. Root aliases also let Army specs import fixtures and contracts without parent-directory chains. Application compiler configs declare paths relative to their own roots for output rewriting. `tsc-alias` converts compiled JavaScript and declaration imports to relative ESM paths with extensions, so production still runs on Node without an alias loader. Generated vendor imports retain their original conventions.

`apps/api/AGENTS.md` records the convention. `tools/architecture-policy.ts` explicitly registers each source file’s feature, responsibility, public symbols, permitted Nest exports, and approved framework modules. `check:boundaries` validates these contracts, framework-independent models/messages/ports/operations, query access to read ports, ORM/SDK confinement, and acyclic source and Nest module dependencies. It resolves public re-exports and dynamic module factories without executing the application. Regression fixtures cover forbidden dependencies, query imports of writes, direct repository access from handlers, source/module cycles, broad exports, and unreviewable metadata. Folder names grant no permissions.

`GET /api/me` accepts no owner selector. The server verifies the session and email before resolving the account. Unknown query parameters fail with `INVALID_REQUEST`. Successful responses and application errors are validated with Zod. Auth endpoints use Better Auth's own validated protocol; the HTTP bridge adds a stable throttle code and standard `Retry-After` header.

`packages/contracts` owns the runtime schemas and shared password policy. `bun run contracts:generate` exports OpenAPI 3.1 and generates the TypeScript SDK with Hey API and Zod response/request validators. The owned client wrapper validates every success and error payload, including empty/204 results for which generated clients can skip validation. Expo sends cookies from Better Auth's dedicated Expo client using `credentials: "omit"`; SecureStore holds session credentials. Foreground checks revalidate with the server. A lifecycle check after body decoding rejects retired responses before the Expo SDK can persist cookies. Sign-out clears local credentials even if remote revocation cannot be confirmed and checks that clearing succeeded before reporting local sign-out.

Authored code inherits the strict TypeScript baseline. The API skips vendor declaration checking because the pinned Better Auth/Drizzle declarations reference optional database drivers and contain incompatible declaration signatures. Generated Hey API runtime code has a separate compiler project with only `exactOptionalPropertyTypes` disabled; the generated runtime explicitly assigns `undefined` to optional fields. These exceptions do not apply to authored logic. Ultracite ignores generated vendor code through its existing preset.

## Verify

```sh
bun run check
bun run check:boundaries
bun run check:nest
bun run contracts:check
bun run typecheck
bun run api:build
bun run test:cqrs
bun run test:mobile:unit
bun run ui:test:web
bun run mobile:build
bun run test:api
```

CI runs these gates with the pinned Node/Bun versions. The existing root build also includes Blume, whose content directory is currently absent; this slice leaves that docs workspace unchanged. `test:api` runs Army's engine-free API target with `fetch`, value matchers, and the application's runtime schemas. A serial group starts its own disposable PostgreSQL 18.6 container, applies reviewed Drizzle migrations, and launches the compiled API using Node. Nine API specs cover verification, two-account isolation, invalid requests, concurrent provisioning, persistence across API/database restarts, recovery, revocation, sign-out, expiry, delivery failure, throttling, database upgrades, and malformed response/error contracts. Fixture process paths are independent of Army's working directory, and cleanup removes only its own container and volume. `test:integration` remains an alias for `test:api`.

CQRS validation includes 37 architecture fixtures, a compiled Nest application-context test, and the Army API specs. The bus test checks handler discovery, rejection of unauthenticated and unverified commands before writes, identity-scoped reads, and read-only queries even when a binding is missing. HTTP acceptance also checks that invalid input is rejected before provisioning. Alias fixtures verify that public contracts remain accessible and private feature imports remain forbidden. `test:cqrs` runs the compiled bus test in CI.

`test:mobile:unit` runs three typed SDK integration regressions with the pinned native fetch implementation and simulated native XHR/FileReader/storage I/O. They verify that delayed, canceled responses cannot restore credentials after confirmed or unconfirmed remote sign-out, and that swallowed native storage failures cannot be reported as successful local clearing. A subsequent current session must still work. The delayed-body regression fails when the post-decode lifecycle guard is removed. Native Army coverage also requests a real recovery link and checks reopening its form after cancelling; repeated links always start a fresh form.

`bun run check:nest` uses pinned `nestjs-doctor` 0.9.10 with full scope and telemetry disabled, without inspecting Git history. The pre-commit hook and dedicated CI workflow require 100/100, zero diagnostics (including informational findings), and zero scanner/rule failures. The gate also rejects suppression directives in code or documentation and configuration that disables rules, categories, or coverage. Five regression tests cover those enforcement cases, empty scans, and malformed reports. All built-in checks remain enabled. The account endpoint declares its admission guard; `/healthz` declares its intentional anonymous policy through `@Public()`.

The additive `0001_rate_limit_audit_timestamps.sql` migration gives rate-limit counters real `created_at` and `updated_at` audit columns while preserving Better Auth's `last_request` window timestamp. PostgreSQL backfills existing rows and supplies insert defaults; Drizzle advances the update timestamp on writes. Army verifies that applying the reviewed migration to an existing counter preserves its key, count, and window time, populates audit fields, and supplies defaults for new rows. The HTTP throttle journey checks that real Better Auth writes advance `updated_at`.

The pinned combination is NestJS/common/core/platform-node `12.3.0`, Nest CQRS `12.1.2`, Nest Drizzle `0.0.2`, Better Auth/Expo/Drizzle adapter `1.7.14`, Drizzle ORM `0.45.4`, Drizzle Kit `0.31.11`, postgres.js `3.4.9`, PostgreSQL `18.6` (image digest in Compose), Zod `4.6.7`, Hey API `0.99.0`, and Node `26.12.1`. Expo remains `58.0.20` with its compatible native modules. Compiled aliases use `tsc-alias` `1.9.9`.

Army's `e2e` runner is pinned at `0.21.3` and its mobile engine at `0.12.4`. `bun run test:mobile:ios` and `bun run test:mobile:android` run the registration/verification/account/relaunch/sign-out journey with generated synthetic credentials. Start the local API, inbox, and Metro on port 8085 first, and install the native debug build with the matching port (`expo run:ios --port 8085 --no-bundler` or `expo run:android --port 8085 --no-bundler`). These builds load Metro from their configured address and have no `expo-dev-client` dependency. Set `GLO5_IOS_DEVICE` or `GLO5_ANDROID_DEVICE` to select an available test device. The default devices are `Gloups GLO-5 iPhone` and `emulator-5560`; the tests never erase a device or reset its keychain. The iOS fixture expects the simulator's default password AutoFill prompts. For Android, reverse port 8081 to Metro 8085 as well as the API port. Army reports and traces are ignored under `e2e/mobile/.e2e`; API reports use `e2e/api/.e2e`.

The Army mobile journey passed again with the shared UI package on 30 October 2026 on an iPhone 17e simulator (iOS 27.0) and a Pixel 8 emulator (Android API 37), including password-reset form re-entry. Native debug builds were installed during GLO-5 validation. Native acceptance exercised the dedicated Better Auth Expo client, SecureStore persistence across app restarts, and the generated feature client against the running API. Email acceptance used the synthetic inbox. The journey waits for registration form transitions and handles native permission prompts, iOS password suggestions and save-password dialogs, and the system confirmation when returning from a verification link. HTTP contracts, authentication policy, and readiness responses are preserved by the module refactor; the rate-limit audit columns are an additive schema change.
