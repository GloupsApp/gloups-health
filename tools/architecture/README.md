# API architecture checks

Run `bun run architecture:check` from the repository root. The same command gates
root check, lint, typecheck/build and pre-commit. It reuses the pinned TypeScript
compiler; no graph framework, unit-test harness or paid/automatic CI is added.
The tools themselves receive the root strict compiler and Ultracite checks.

## Context and source graph

Every API source under `apps/api/src/` is inspected, including generated schema
source for import edges. The resolver reads the API tsconfig (or root config
before the API workspace exists), follows its aliases and canonical paths, and
collects imports, named re-exports, import types and literal dynamic imports or
require calls. Type-only edges participate in cycle detection. No source import
cycle, including a self-cycle, is permitted.

Within `modules/<context>/`, files belong to domain, application, infrastructure,
presentation or composition, plus the named `<context>.module.ts` root. Other
contexts can consume only `application/public-api.ts`; composition may also
import the other context's root Nest module. Domain remains context-local.
Public APIs name owning application contracts/providers explicitly. They cannot
re-export domain entities, other contexts or outer adapters. Wildcard/namespace
barrels and computed module loading are rejected. Core dependencies resolve to
inner contracts; third-party/Node integration and unknown outer barrels are
rejected. Shared packages need their own approved boundary before consumption.
The resolver supplements Oxlint's fast package/layer restrictions.

## Nest modules and exports

Module decorators use direct named Nest imports. Module metadata is an inline
object with literal imports/exports arrays. Spreads, computed keys, hidden lists,
forward module factories and unsupported dynamic module calls fail the check.
A separate Nest import graph detects cycles even between modules in the same
source file. Nest provider construction is still verified by real startup.

Exports name imported, locally registered providers. Feature roots expose only
providers/tokens from their owning `application/public-api.ts`, with local
binding to internal implementations when needed. Internal modules expose their
own application providers; they cannot re-export entire private modules.

The explicit private adapter exceptions are:

| Owning module          | Export                                 | Actual consumer                                       |
| ---------------------- | -------------------------------------- | ----------------------------------------------------- |
| Platform configuration | API_CONFIG                             | Outer composition/HTTP configuration                  |
| Platform persistence   | Official DrizzleModule                 | Named connection composition/readiness                |
| Identity persistence   | DATABASE                               | Identity SDK/social/deletion composition and worker   |
| Authentication         | AUTH, BetterAuthGateway                | Identity social composition and protocol presentation |
| Identity HTTP policies | TrustedOriginGuard, RequestBudgetGuard | Identity HTTP modules                                 |

Each exception is matched by the exact owning module, source and symbol. They do
not permit cross-context deep imports or feature-root SDK/database exports. The
only dynamic-module factories currently accepted are platform ConfigModule.forRoot
and DrizzleModule.forRootAsync. New exceptions require an explicit review of the
consumer/contract; avoid prefix or wildcard escape hatches.

## Evidence and limits

A checkpoint without API source reports zero sources/modules explicitly. This is
not product acceptance. The [dated evidence](../../docs/verification/2026-10-29-authentication-enforcement.md)
records actual CLI acceptance probes over isolated temporary source trees and
the later integrated source. No unit tests or TDD are used. The check neither
executes application code nor starts services. HTTP/Postgres and native/provider
acceptance remain separate from these static checks.
