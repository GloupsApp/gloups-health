# Engineering task registry

The domain packets below are ready for assignment to write specifications, not
to implement features. Their owners remain unassigned. The separately approved
tooling implementation has one assigned owner. A coordinator records assignments
on main before workers start. Follow
[AGENT-WORKFLOW](../AGENT-WORKFLOW.md) and use the [template](TEMPLATE.md).

| Implementation packet                     | Owner                                           | Status              | Approved scope                                                 |
| ----------------------------------------- | ----------------------------------------------- | ------------------- | -------------------------------------------------------------- |
| [TOOL-001](TOOL-001-workspace-tooling.md) | Codex chat 01a18275-5307-7d93-98f7-10ca191559f3 | Done on PR #6 merge | Bun/Turborepo tooling, Blume docs, Changesets and commit hooks |

| Packet                             | Specification output                                                 | Dependency before code                                             |
| ---------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [FND-001](FND-001-foundation.md)   | Account/common contracts and tooling/architecture bootstrap proposal | Founder architecture decisions and accepted shared contracts       |
| [NUT-001](NUT-001-nutrition.md)    | Food, meals, hydration and numeric/provenance contract               | Accepted foundation and nutrition contracts                        |
| [TRN-001](TRN-001-training.md)     | Workout programs, live sessions, timers and progression contract     | Accepted foundation/training contracts and fitness scope           |
| [SLP-001](SLP-001-sleep.md)        | Sleep, naps, correction and rest-input contract                      | Accepted foundation/sleep/ingestion contracts                      |
| [CYC-001](CYC-001-cycle.md)        | Optional cycle, symptoms and context-consent contract                | Population/method decisions and accepted cycle/ingestion contracts |
| [ING-001](ING-001-ingestion.md)    | HealthKit/Health Connect source/reconciliation contract              | Accepted domain record semantics and platform coverage             |
| [COA-001](COA-001-coaching.md)     | Authorized context, daily guidance, explanation and action contract  | Accepted domain outputs, goal/method review and provider decision  |
| [MIG-001](MIG-001-source-reuse.md) | Source/asset/usage inventory and migration decision record           | Founder usage/rights/preservation answers; no destructive work     |

Each can draft its bounded specification independently using the common
requirements, explicitly marking proposed interface bindings. The integration
owner reconciles and approves shared vocabulary/versions before producers and
consumers begin code. COA-001 can design permissions/explanation requirements now;
final context shapes depend on domain contracts. ING-001 cannot approve a source
record shape on behalf of a domain owner.

TOOL-001 permits only its listed tooling and documentation workspace files.
Product application scaffolding/imports still require separate approval with
exact files, real versions/targets, accepted dependencies and verification.
Do not add package manifests or source code from a specification assignment.
Task status is internal; public Canny status is a separate decision.
