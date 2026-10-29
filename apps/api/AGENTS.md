# API scope

Read root [AGENTS](../../AGENTS.md), [ARCHITECTURE](../../docs/ARCHITECTURE.md),
[CONTRACTS](../../docs/CONTRACTS.md), [I18N](../../docs/I18N.md) and the assigned packet.
This checkpoint provides the AUTH-003 NestJS/Fastify platform and managed
Drizzle connections. Later review slices add core identity, schema, auth HTTP,
the sink and worker. See the packet/review map for current available behavior.
Health domains and production deployment remain unimplemented.

NestJS's official Fastify adapter, Drizzle ORM and DDD with Onion architecture
are selected under D016. PostgreSQL is selected under D017. AUTH-003 records Node/Postgres/driver pins and the approved local composition;
hosting and live-provider setup remain separate. Organize each bounded context into
domain, application, infrastructure and presentation, with Nest module/bootstrap
wiring at the outer composition root. Domain/application stay plain TypeScript
and depend inward through ports, without NestJS, Fastify, Better Auth or Drizzle
imports. Keep persistence rows, HTTP DTOs and SDK results outside the core.
Use Drizzle repositories and the official Better Auth Drizzle adapter in
infrastructure, with reviewed Drizzle Kit migrations. Controllers/guards call
use cases; Drizzle transactions implement an application unit-of-work port.
Keep accepted schemas/DTOs independent of ORM entities.
Derive record ownership from verified identity; validate every boundary and keep
writes/retry receipts atomic. Domain calculations and authorization do not belong
in model prompts. Keep exact units/time/provenance and language-neutral errors.

The integration owner controls composition, migrations, shared contracts and
workspace configuration. A feature worker requests changes to those paths instead
of editing another lane. No credentials or real data may enter the repository.

After implementation is authorized, use E2E Army over a running HTTP service and
isolated database for values, isolation, concurrency, restart and failure paths.
No unit tests or TDD. Do not copy the old Rust runtime, production database or
Mioum's anonymous-auth assumptions as the new service contract.
