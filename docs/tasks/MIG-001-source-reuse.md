# MIG-001: Source, asset and data-transition inventory

Status: Ready for specification. Owner: unassigned. No implementation is authorized.
The coordinator must record an owner/branch/workspace on main before work starts.

## Read

Read [root instructions](../../AGENTS.md), [PRODUCT](../PRODUCT.md),
[DECISIONS](../DECISIONS.md), [CONTRACTS](../CONTRACTS.md), [I18N](../I18N.md),
[AGENT-WORKFLOW](../AGENT-WORKFLOW.md) and the
[design draft](../specs/2026-10-27-unified-health-coach-design.md).

## Deliverable and ownership

Inventory useful source modules/assets with exact revision/path/rights and behavior evidence. Obtain founder answers about actual users/data and any preservation duties; distinguish source transfer from production cutover.

Allowed output: `docs/specs/source-reuse.md` and the handoff section of this packet.
Shared/root files and other packets are owned by the integration coordinator.
Do not import application code, inspect/copy real health records, move secrets, delete data or change production.

A specification may propose exact interfaces independently. It must identify
which bindings depend on the foundation/other domains and who approves them;
proposed types are not accepted wire contracts. Resolve [owner decisions](../DECISIONS.md)
that affect this domain before final implementation planning.

## Acceptance

Produce a candidate mapping, intentional behavior differences, rights/usage decisions, retention/migration needs and per-domain boundary acceptance. Explicitly identify unanswered founder questions and keep source evidence historical.

Check links, internal consistency, scope and the assigned diff. Use concrete
real-boundary acceptance cases in the spec; do not write unit tests or TDD steps.
Commit/push/PR/merge after relevant checks within the assigned task.

## Handoff

Not started. Record owner, workspace/base, commit/PR, actual checks, proposed or
accepted interfaces, unresolved decisions, consumer impact and resources before
handoff. Product code remains dependent on approval and an implementation packet.
