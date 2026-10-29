# Architecture

This repository has engineering documents, Bun/Turborepo tooling, a local Blume
site and AUTH-003 authentication source: NestJS/Fastify with Drizzle/Postgres
and an Expo SDK 58 Router client. Credential/lifecycle API cases have local E2E
evidence. Native/provider acceptance is in progress; product web and health
domains remain reserved.
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
`@gloups/api`, `@gloups/docs` and `@gloups/mobile` are executable workspaces; their tasks run
through Turborepo. TOOL-002 adds the shared strict TypeScript baseline and compiler
checks for root tooling and the docs project. TOOL-003 adds the Expo SDK 58 shell,
mobile compiler checks and iOS/Android bundle exports. See
[CODE-STANDARDS](CODE-STANDARDS.md#typescript-configuration) for inheritance,
runtime settings and the scoped dependency-declaration exceptions. Pin reviewed
framework versions in each future implementation packet.

## Placement and ownership

| Planned path       | Responsibility                                                                                    | Current state                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| apps/api           | NestJS composition, HTTP, application use cases, domain rules and persistence adapters by feature | Local auth service; credential E2E, social/lifecycle pending         |
| apps/mobile        | Expo routes, feature screens, native adapters and account-scoped offline state                    | Authentication routes/features under review; native evidence pending |
| apps/web           | Possible product web app                                                                          | Empty reserved folders; framework undecided                          |
| apps/docs          | Blume documentation site                                                                          | Runnable local workspace; static build; no deployment                |
| packages/contracts | Approved wire schemas, explicit units and identifiers consumed by API/mobile                      | Scoped instructions only; no package                                 |
| design             | Canonical brand tokens/assets                                                                     | Canonical base/theme tokens in mobile; other assets reserved         |
| e2e/api            | Real HTTP acceptance with isolated PostgreSQL                                                     | Official Army real-boundary cases; see dated evidence                |
| e2e/mobile         | Real app/device journeys                                                                          | Official Army real-boundary cases; see dated evidence                |
| tools              | Proven build/verification utilities required by real workflows                                    | Scope reserved; no utilities                                         |
| docs               | Product/architecture guides, domain specs/contracts, work packets and evidence                    | Present                                                              |

Existing web/email services remain in the source repository. Migration of those
workloads needs a separate task; the documentation site does not replace them.

Within the API keep identity, goals, food/catalog, nutrition/hydration, training,
sleep, cycle, ingestion, coaching, privacy/audit and billing/notifications as
responsibilities inside the service. Keep feature rules beside the feature;
transport and persistence details must not define its public domain vocabulary.

## DDD and Onion architecture

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

The proposed first context lives under `apps/api/src/modules/identity-access/`
with `domain/`, `application/`, `infrastructure/`, `presentation/` and an outer
`identity-access.module.ts`. These are planned paths, not existing code or
scaffolding authorization. Health contexts consume approved application contracts
rather than reaching into identity tables or concrete repositories. Keep only
the abstractions required by real use cases; no generic base framework is implied.

Fastify transport/parsing/CORS and the Better Auth protocol live at the outer
edge. Persistence uses the official Better Auth Drizzle adapter and Drizzle
repositories, with one reviewed SQL migration history owned by Drizzle Kit.
Authentication provider records remain separate from immutable Gloups account
identity and lifecycle rules. No application or domain type exposes an HTTP
request, SDK session, database row or transaction client.

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
