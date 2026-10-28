# Specifications

The [unified health coach design](2026-10-27-unified-health-coach-design.md)
records the full scope and proposed architecture. Confirmed choices are indexed
in [DECISIONS](../DECISIONS.md). The design remains a draft.

The [authentication design](2026-10-28-authentication-design.md) specifies the
owner's Better Auth/NestJS/Expo direction under AUTH-001. Fastify, Drizzle ORM and
DDD/Onion are confirmed under D016. Google, Apple,
email/password and the native/browser split are confirmed. The owner approved
the design at PR #22 and selected PostgreSQL under D017. The
[implementation plan](../plans/2026-10-28-authentication-implementation.md) is
the next review artifact; execution remains separately assigned.

Assigned domain packets create separate specs in the paths named by the
[task registry](../tasks/README.md). Each spec must define behavior, inputs/outputs,
units/time semantics, failures, permissions, dependencies and real-boundary
acceptance. Record proposed choices separately from owner decisions.

Approve relevant specs/contracts before implementation planning. Link approval
and the accepted revision from the packet; do not infer approval from a document
being merged. No application implementation is authorized by this index.
