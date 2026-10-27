# API scope

Read root [AGENTS](../../AGENTS.md), [ARCHITECTURE](../../docs/ARCHITECTURE.md),
[CONTRACTS](../../docs/CONTRACTS.md), [I18N](../../docs/I18N.md) and the assigned packet.
This directory contains instructions only; no NestJS project or Nx target exists.

NestJS is the selected direction. PostgreSQL/Prisma and module layout remain
proposals until approved. Keep accepted schemas/DTOs independent of ORM entities.
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
