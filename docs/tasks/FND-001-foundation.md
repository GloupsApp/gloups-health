# FND-001: Account/common contracts and tooling proposal

Status: Ready for specification. Owner: unassigned. No implementation is authorized.
The coordinator must record an owner/branch/workspace on main before work starts.

## Read

Read [root instructions](../../AGENTS.md), [PRODUCT](../PRODUCT.md),
[DECISIONS](../DECISIONS.md), [CONTRACTS](../CONTRACTS.md), [I18N](../I18N.md),
[AGENT-WORKFLOW](../AGENT-WORKFLOW.md) and the
[design draft](../specs/2026-10-27-unified-health-coach-design.md).

## Deliverable and ownership

Define verified identity mapping, common request/error/revision/idempotency vocabulary, schema approval/versioning and a concrete future NestJS bootstrap proposal using the accepted Bun/Turborepo tooling. Separate confirmed NestJS from proposed client/database/ORM versions. TOOL-001 owns the repository tooling setup.

Allowed output: `docs/specs/foundation-contracts.md` and the handoff section of this packet.
Shared/root files and other packets are owned by the integration coordinator.
Do not create manifests, a lockfile, framework projects, migrations or provider applications.

A specification may propose exact interfaces independently. It must identify
which bindings depend on the foundation/other domains and who approves them;
proposed types are not accepted wire contracts. Resolve [owner decisions](../DECISIONS.md)
that affect this domain before final implementation planning.

## Acceptance

List exact producers/consumers; include auth/account deletion, conflict/retry/rollback, runtime compatibility and an executable future target proposal with verification. Do not describe proposed commands as available now.

Check links, internal consistency, scope and the assigned diff. Use concrete
real-boundary acceptance cases in the spec; do not write unit tests or TDD steps.
Commit/push/PR/merge after relevant checks within the assigned task.

## Handoff

Not started. Record owner, workspace/base, commit/PR, actual checks, proposed or
accepted interfaces, unresolved decisions, consumer impact and resources before
handoff. Product code remains dependent on approval and an implementation packet.
