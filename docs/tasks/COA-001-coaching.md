# COA-001: Authorized daily coaching context and action contract

Status: Ready for specification. Owner: unassigned. No implementation is authorized.
The coordinator must record an owner/branch/workspace on main before work starts.

## Read

Read [root instructions](../../AGENTS.md), [PRODUCT](../PRODUCT.md),
[DECISIONS](../DECISIONS.md), [CONTRACTS](../CONTRACTS.md), [I18N](../I18N.md),
[AGENT-WORKFLOW](../AGENT-WORKFLOW.md) and the
[design draft](../specs/2026-10-27-unified-health-coach-design.md).

## Deliverable and ownership

Specify food/training/rest recommendations, permitted context snapshots, factual references, explanations, proposed vs accepted actions, stale-context invalidation and no-provider fallback.

Allowed output: `docs/specs/coaching-contracts.md` and the handoff section of this packet.
Shared/root files and other packets are owned by the integration coordinator.
Do not select a paid provider, commit model tools/runtime code or use a prompt as authorization/calculation.

A specification may propose exact interfaces independently. It must identify
which bindings depend on the foundation/other domains and who approves them;
proposed types are not accepted wire contracts. Resolve [owner decisions](../DECISIONS.md)
that affect this domain before final implementation planning.

## Acceptance

Cover missing/stale/corrected/deleted records, consent changes, goal conflicts, numeric contradictions, malicious record text, version conflicts, limits and reviewed model-quality cases. Final context bindings depend on accepted domain outputs and scientific/provider decisions.

Check links, internal consistency, scope and the assigned diff. Use concrete
real-boundary acceptance cases in the spec; do not write unit tests or TDD steps.
Commit/push/PR/merge after relevant checks within the assigned task.

## Handoff

Not started. Record owner, workspace/base, commit/PR, actual checks, proposed or
accepted interfaces, unresolved decisions, consumer impact and resources before
handoff. Product code remains dependent on approval and an implementation packet.
