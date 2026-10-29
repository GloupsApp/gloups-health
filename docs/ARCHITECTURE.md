# Architecture

This repository has engineering documents, workspace tooling, a local Blume
documentation site and a minimal Expo SDK 58 mobile shell. API and product web
paths reserve future work;
AGENTS files and empty directories do not make them executable projects.
The full [design draft](specs/2026-10-27-unified-health-coach-design.md) is not yet
approved for product implementation.

## Runtime direction

NestJS with its official Fastify adapter, Drizzle ORM and DDD with Onion
architecture are confirmed under D016. The Expo/React Native foundation and
official Better Auth integration are confirmed under D014/D015. Google, Apple and
email/password are selected. The
[authentication design](specs/2026-10-28-authentication-design.md) describes the
Fastify request/response bridge, official Drizzle adapter, account boundaries and
Expo client; its design is approved for implementation planning under D017.

The selected database is PostgreSQL under D017, with Drizzle ORM for new
persistence. One feature-organized NestJS service and protected media remain the
runtime direction. Database hosting/version and the underlying driver remain
implementation-packet choices.
Native product controls remain subject to their design packets. Do not create
microservices, a second
permanent backend, a generic shared domain framework or speculative packages.

Bun 1.4.4 workspaces, one root `bun.lock`, Turborepo and Ultracite/Oxlint/Oxfmt
are configured by TOOL-001. D011 supersedes the earlier Nx convention.
`@gloups/docs` and `@gloups/mobile` are executable workspaces; their tasks run
through Turborepo. TOOL-002 adds the shared strict TypeScript baseline and compiler
checks for root tooling and the docs project. TOOL-003 adds the Expo SDK 58 shell,
mobile compiler checks and iOS/Android bundle exports. See
[CODE-STANDARDS](CODE-STANDARDS.md#typescript-configuration) for inheritance,
runtime settings and the scoped dependency-declaration exceptions. Pin reviewed
framework versions in each future implementation packet.

## Placement and ownership

| Planned path       | Responsibility                                                                                    | Current state                                          |
| ------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| apps/api           | NestJS composition, HTTP, application use cases, domain rules and persistence adapters by feature | Scoped instructions only                               |
| apps/mobile        | Expo routes, feature screens, native adapters and account-scoped offline state                    | Minimal Expo SDK 58 shell; product flows unimplemented |
| apps/web           | Possible product web app                                                                          | Empty reserved folders; framework undecided            |
| apps/docs          | Blume documentation site                                                                          | Runnable local workspace; static build; no deployment  |
| packages/contracts | Approved wire schemas, explicit units and identifiers consumed by API/mobile                      | Scoped instructions only; no package                   |
| design             | Canonical brand tokens/assets                                                                     | Scope reserved; no assets imported                     |
| e2e/api            | Real HTTP acceptance with isolated PostgreSQL                                                     | Scope reserved; no harness                             |
| e2e/mobile         | Real app/device journeys                                                                          | Scope reserved; no harness                             |
| tools              | Proven build/verification utilities required by real workflows                                    | Scope reserved; no utilities                           |
| docs               | Product/architecture guides, domain specs/contracts, work packets and evidence                    | Present                                                |

Existing web/email services remain in the source repository. Migration of those
workloads needs a separate task; the documentation site does not replace them.

Within the API keep identity, goals, food/catalog, nutrition/hydration, training,
sleep, cycle, ingestion, coaching, privacy/audit and billing/notifications as
responsibilities inside the service. Keep feature rules beside the feature;
transport and persistence details must not define its public domain vocabulary.

## DDD and Onion architecture

AUTH-003 target module pattern, under owner review. The following staged PRs
introduce the source; the verified extraction reference is recorded in the
[review evidence](verification/2026-10-29-authentication-review-stack.md).

This is the owner's confirmed dependency rule for future API implementation,
based on the supplied
[NestJS/DDD/Onion reference](https://medium.com/@patrick.cunha336/structuring-a-nestjs-project-with-ddd-and-onion-architecture-65b04b7f2754)
and the [original Onion dependency principle](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/).
Group code by bounded context, with domain, application, infrastructure and
presentation responsibilities inside each context. The initial auth slice owns
identity/access and the internal Gloups account boundary; other domains still
need their approved contracts before implementation.

| Layer          | Owns                                                                                             | Dependency rule                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Domain         | Aggregates/entities, value objects, invariants and repository contracts                          | Plain TypeScript; no framework, transport, ORM or provider imports                                     |
| Application    | Use cases, plain input/output types and outbound service/unit-of-work ports                      | Depends on domain/inner contracts; no infrastructure, Fastify, NestJS, Drizzle or Better Auth imports  |
| Infrastructure | Drizzle repositories/schema/mappers, Better Auth session adapter, email/provider implementations | Implements inner ports; maps external models into core values                                          |
| Presentation   | Nest controllers/guards, Fastify protocol bridge, HTTP DTO validation and response mapping       | Calls application use cases; keeps business/transaction rules in the core                              |
| Composition    | Feature Nest modules and bootstrap wiring                                                        | Binds ports to adapters through tokens/factories; framework decorators stay outside domain/application |

Dependency arrows point inward. A repository implementation depends on its core
contract, while the core never imports that implementation. Application use
cases define transaction and retry intent through a unit-of-work port; Drizzle
transactions and row types stay in infrastructure. An ORM row is not a domain
entity, and Better Auth's provider-account model is not a Gloups account.

The first context lives under `apps/api/src/modules/identity-access/`, with
`domain/`, `application/`, `infrastructure/`, `presentation/` and private
`composition/` modules. Its root `IdentityAccessModule` exports no SDK/database
resource. Internal modules separate identity application/persistence, the Better
Auth adapter, credential HTTP, social HTTP and deletion. Feature composition
binds plain use cases to their actual adapters; it does not decorate the core.

Platform configuration, named main/proof database connections and health live in
`apps/api/src/platform/`. Nest's ConfigModule validates the namespaced config;
the official DrizzleModule owns both connection lifecycles. Bootstrap selects
the Fastify adapter, CORS and prefix; it does not retrieve feature SDK/database
internals. The deletion worker has a separate Nest application-context graph
without HTTP controllers or listeners. Shutdown drains the current durable
handoff before the database lifecycle closes its connections.

HTTP controllers use schema-backed Nest pipes, typed current-identity/account
decorators and origin/budget guards. APP_GUARD and APP_FILTER are DI providers.
SDK-owned auth endpoints retain one scoped Fastify bridge for raw payloads,
redirects and individual cookies; the Better Auth gateway owns SDK invocation.
Those protocol adapters stay outside the core. Native provider input interfaces
are plain values; presentation owns their validation schemas. Presentation may
consume these protocol gateways but cannot import persistence implementations.

Account and deletion transactions have separate unit-of-work ports. Deletion
uses the account aggregate's lifecycle transition before repository persistence;
the repository checks the immutable account/identity pair. Proof admission
precedes a main transaction. No HTTP request, SDK result or transaction client
enters a domain/application signature. Health contexts consume approved
application contracts rather than identity tables or repositories.

Oxlint enforces the inward imports: domain cannot depend on application/outer
layers, core cannot import Nest/Fastify/SDK/ORM packages, infrastructure cannot
import presentation/composition, and presentation cannot reach persistence.
The [review decomposition](plans/2026-10-29-authentication-review-decomposition.md)
records the owner-requested staged delivery. A folder name alone is insufficient.

Fastify transport/parsing/CORS and the Better Auth protocol live at the outer
edge. Persistence uses the official Better Auth Drizzle adapter and Drizzle
repositories, with one reviewed SQL migration history owned by Drizzle Kit.
Authentication provider records remain separate from immutable Gloups account
identity and lifecycle rules. No application or domain type exposes an HTTP
request, SDK session, database row or transaction client.

## Executable boundary checks

`bun run architecture:check` uses the pinned TypeScript resolver and compiler AST
against every source file under `apps/api/src/`. It runs before root check, lint,
typecheck/build and commits. PR #27 has no API source yet; a zero-source result is
reported explicitly and is not authentication acceptance. Later source slices
must pass the same check. See [checker scope](../tools/architecture/README.md).

A context can consume another context only through its named
`application/public-api.ts`, or through its root Nest module from composition.
Domain code cannot import another context. Public APIs expose owning application
contracts, not domain entities or adapter types. Public imports and re-exports
are named; wildcard barrels, private deep imports and unclassified context files
are rejected. No shared-contract package is implicitly approved.

The resolver follows aliases, relative paths, re-exports, import types and literal
`import()`/`require()` calls. It checks source cycles including type-only edges,
and Nest module import cycles including multiple modules in one file. Computed
module loading or metadata that hides imports/exports fails the check. Core code
stays on resolved inner TypeScript contracts; third-party and Node integrations
belong in outer adapters.

Nest exports must name locally registered providers. A context root may expose
only tokens/providers imported from its application public API. It must bind a
public token locally when delegating to an internal provider. Internal modules
may export their owning application providers, with narrow, source-and-symbol
adapter exceptions reviewed in the checker for current SDK/HTTP/persistence
consumers. Re-exporting an entire private Nest module is rejected. Platform
configuration and the official Drizzle module have explicit exceptions; these
do not open feature resources to other contexts.

Nest still validates provider construction at startup. Static import/metadata
checks do not execute the application or replace actual HTTP/Postgres/device
acceptance. There is no new CI workflow or unit-test harness.

## Mobile and coaching boundaries

The mobile app owns native interaction, platform permissions, durable local
commands and device adapters. HealthKit/Health Connect remain device-side
integrations. The service owns accepted records, calculations, authorization and
coaching action execution. Do not compare different sensor definitions as if
interchangeable or imply every wearable supplies every field through a hub.

The model receives a permission-filtered context with data references, freshness,
missingness and calculation versions. It explains reviewed facts and proposes
bounded actions. Application code owns numeric calculations and record writes.

## Contract-first changes

[CONTRACTS](CONTRACTS.md) defines common requirements. Each lane drafts its own
contract proposal in its assigned spec path. The integration owner approves
shared vocabulary/schema versions before producers and consumers implement
independently. Implementation consumes an approved version; downstream workers do
not guess an upstream shape or copy a mutable proposal as an accepted API.

The integration owner serializes workspace manifests/lockfile, API composition,
root configuration, shared contract exports, schema migrations and brand tokens.
A lane requests shared changes through its task handoff. Parallel agents do not
both write a root file and rely on a merge conflict to negotiate the design.
