# Authentication review decomposition

Date: 29 October 2026. Owner: AUTH-003 integration owner in the existing015e worktree.
This is an execution amendment to the approved authentication design/plan after
owner review of PR26. It preserves D015/D016/D018/D019, official Better Auth/Expo,
Fastify, Drizzle/Postgres, framework-free domain/application, no unit tests/TDD,
and the existing immutable account/session/deletion contracts. No new product
flow, provider registration, deployment or release policy is approved here.

## Concrete problems

PR26 combines platform setup, core identity, credentials, social integrations,
deletion, mobile state, UI and acceptance infrastructure. Its diff is too large
for owner review. The first module also has a single large composition factory,
bootstrap access to feature internals, repeated HTTP validation and SDK calls in
controllers, a concrete Drizzle limiter in the guard, and a worker that constructs
its graph outside Nest. Existing folder names alone do not establish those
boundaries.

## Target boundaries

- Domain: Gloups account invariants and repository contracts; plain TypeScript.
- Application: use cases, explicit values and outbound ports; plain TypeScript.
- Infrastructure: official Better Auth adapter, Drizzle repositories/unit of work,
  provider verification, email and deletion implementations. SDK models and
  transaction clients remain here.
- Presentation: Nest controllers, guards, parameter decorators, validation pipes,
  exception mapping and the tightly scoped Fastify protocol bridge. SDK-owned
  authentication endpoints retain their exact raw-body/redirect/cookie semantics.
- Composition: small Nest modules bind core ports and private adapters. Modules
  export the contracts needed by their actual consumers. HTTP and worker roots
  have separate graphs and share the same persistence/deletion providers.

Use Nest ConfigModule for validated namespaced configuration, the documented
official DrizzleModule with named main/proof databases and managed shutdown,
async readiness/lifecycle hooks, APP_FILTER/APP_GUARD providers, typed current
identity/account decorators and schema-backed Nest pipes. The backend remains
Better Auth; Nest's separate authentication engine is outside this request.
The database driver remains postgres.js and Drizzle0.45.4; no pg migration or
RC ORM upgrade is intended. Both new Nest packages must be exact, official,
registry-verified compatible stable releases.

The identity context separates core/persistence, authentication SDK, credential
HTTP, social HTTP and account deletion composition. Health belongs to the platform.
The worker uses NestFactory.createApplicationContext and a managed service;
its durable operations continue through the plain ProcessAccountDeletion use
case. No CQRS bus, broker, generic domain framework or paid telemetry is needed
for the current consumers.

## Delivery sequence

Create a cumulative review stack, each PR based on the previous branch. Each
files-changed view must contain one concern and its local evidence; generated
lockfiles/schema snapshots are identified separately. Every checkpoint compiles
and starts without referencing a later slice. The exact boundaries can be
narrowed while extracting the verified source, without changing behavior.

1. Architecture/review contract: this amendment and packet/architecture guidance.
2. API platform: Nest configuration, official Drizzle DI/lifecycle, Fastify root,
   safe errors, health, scripts and exact dependencies.
3. Identity core/persistence: account domain/use cases, repository/unit of work,
   typed ports and generated schema/migrations; no new product endpoint yet.
4. Credentials/session: official Better Auth bridge, email verification/reset,
   guard/current-actor decorators, me and password operations, focused API cases.
5. Social integrations: browser Google/Apple, native iOS Apple, provider vault,
   explicit linking and notifications; live-provider acceptance stays pending.
6. Deletion: command, reservation guards, Nest application-context worker,
   durable retry/reconciliation/expiry and real HTTP/Postgres cases.
7. Expo session foundation: official clients, secure generation/storage,
   locale preference and session/account ownership services.
8. Credential UI: Router, canonical theme, en/fr forms and recovery callbacks.
9. Mobile social/account lifecycle: native Apple/browser controls, methods,
   sign-out/deletion and device acceptance infrastructure.
10. Final acceptance/handoff where it cannot be co-located with its owning slice.

Prefer preserving PR26's branch/history while turning its review into the final
small slice, or explicitly mark it superseded if preserving history cannot give
a small diff. Never force-push or merge a source PR. All replacement PRs stay
open for owner review, auto-merge disabled. Attach every created PR to this chat.

## Verification

No unit tests, TDD or fabricated red/green. Run authored strict TypeScript,
Ultracite and the actual Turbo graph at each checkpoint; build the owning
workspace before claiming it runnable. Verify platform/credentials/lifecycle
through E2E Army against the isolated database and actual service. After module
changes repeat the integrated29-case HTTP/Postgres suite and exercise worker
startup/shutdown. Keep existing native/provider gaps explicit; exports cannot
replace device journeys. Preserve ignored environments, generated native data
and the stopped owned database volume. Start/stop only this lane's resources.

## Primary guidance

- [Full official Nest documentation](https://docs.nestjs.com/llms-full.txt)
- [Modules](https://docs.nestjs.com/modules)
- [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [Drizzle](https://docs.nestjs.com/data/drizzle)
- [Configuration](https://docs.nestjs.com/application/configuration)
- [Pipes](https://docs.nestjs.com/pipes)
- [Lifecycle](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [Standalone apps](https://docs.nestjs.com/standalone-applications)
- [Approved design](../specs/2026-10-28-authentication-design.md)
- [Original plan](2026-10-28-authentication-implementation.md)
