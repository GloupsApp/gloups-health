# Architecture proposal

This repository has documents and metadata only. The paths below reserve
ownership for future code; AGENTS files do not make them executable projects.
The full [design draft](specs/2026-10-27-unified-health-coach-design.md) is not yet
approved for product implementation.

## Runtime direction

NestJS is confirmed. The proposed runtime is one feature-organized NestJS service,
PostgreSQL, protected media and one Expo/React Native app with native platform
controls. Prisma is a reuse candidate. Do not create microservices, a second
permanent backend, a generic shared domain framework or speculative packages.

Bun 1.4.2, one root lockfile, Nx and Ultracite/Oxlint/Oxfmt are future repository
tooling conventions. Pin compatible runtime/framework versions and define actual
Nx targets in an approved bootstrap task. None is installed/configured here.

## Placement and ownership

| Planned path | Responsibility | Current state |
| --- | --- | --- |
| apps/api | NestJS composition, HTTP, application use cases, domain rules and persistence adapters by feature | Scoped instructions only |
| apps/mobile | Expo routes, feature screens, native adapters and account-scoped offline state | Scoped instructions only |
| packages/contracts | Approved wire schemas, explicit units and identifiers consumed by API/mobile | Scoped instructions only; no package |
| design | Canonical brand tokens/assets | Scope reserved; no assets imported |
| e2e/api | Real HTTP acceptance with isolated PostgreSQL | Scope reserved; no harness |
| e2e/mobile | Real app/device journeys | Scope reserved; no harness |
| tools | Proven build/verification utilities required by real workflows | Scope reserved; no utilities |
| docs | Product/architecture guides, domain specs/contracts, work packets and evidence | Present |

Existing web/email services remain in the source repository. Migration of those
workloads needs a separate task; this bootstrap does not create replacement apps.

Within the API keep identity, goals, food/catalog, nutrition/hydration, training,
sleep, cycle, ingestion, coaching, privacy/audit and billing/notifications as
responsibilities inside the service. Keep feature rules beside the feature;
transport and persistence details must not define its public domain vocabulary.

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
