# Gloups documentation

Start with [README](../README.md), [AGENTS](../AGENTS.md) and
[CONTRIBUTING](../CONTRIBUTING.md). These documents stand on their own; another
worker does not need the founders' chat history.

## Product and decisions

| Document                                                                 | Covers                                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [PRODUCT](PRODUCT.md)                                                    | Confirmed audience, worldwide launch, languages, launch features and open product boundaries                                   |
| [ROADMAP](../ROADMAP.md)                                                 | Engineering milestones and public status rules                                                                                 |
| [DECISIONS](DECISIONS.md)                                                | Accepted choices, proposals and decisions that still need an owner                                                             |
| [Design draft](specs/2026-10-27-unified-health-coach-design.md)          | Full unified scope and proposed architecture                                                                                   |
| [Authentication design](specs/2026-10-28-authentication-design.md)       | Better Auth with official NestJS/Expo integration, confirmed sign-in methods and proposed lifecycle/acceptance                 |
| [Canny copy](marketing/roadmap/2026-10-27-unified-health-coach.md)       | Original bilingual drafts; unpublished                                                                                         |
| [Cost benchmark](research/2026-10-27-low-cost-architecture-benchmark.md) | Stack, vendor and compliance benchmark for a from-scratch start; its recommendations are proposals until recorded in DECISIONS |

## Working here

| Document                                | Covers                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| [ARCHITECTURE](ARCHITECTURE.md)         | Proposed runtime, actual/planned paths, boundaries and placement                   |
| [AGENT-WORKFLOW](AGENT-WORKFLOW.md)     | Assignment, isolation, shared-file ownership, contracts and handoff                |
| [Tasks](tasks/README.md)                | Specification packets, approved tooling/mobile foundation, dependencies and owners |
| [CONTRACTS](CONTRACTS.md)               | Common contract requirements and change coordination                               |
| [I18N](I18N.md)                         | Language, region, timezone, units, currency and international acceptance           |
| [CODE-STANDARDS](CODE-STANDARDS.md)     | Future coding/tool conventions and the no-unit-test policy                         |
| [DESIGN](DESIGN.md)                     | Native component direction, brand source and reference workflow                    |
| [VERIFICATION](VERIFICATION.md)         | Boundary acceptance, evidence and current documentation checks                     |
| [SECURITY-PRIVACY](SECURITY-PRIVACY.md) | Consumer safeguards and future healthcare requirements                             |
| [SERVICES](SERVICES.md)                 | Existing selected services, setup limits and unknowns                              |
| [MIGRATION](MIGRATION.md)               | Source references, transfer rules and preservation decisions                       |
| [RELEASING](RELEASING.md)               | Git, deployment, distribution and market readiness boundaries                      |

## Records and templates

[Specifications](specs/README.md), [implementation plans](plans/README.md),
[contracts](contracts/README.md), [verification records](verification/README.md)
and the [task template](tasks/TEMPLATE.md) have distinct purposes. Keep durable
guides here, approved contracts under contracts, active plans under plans and
dated observations under verification. Do not turn a guide into an activity log.

The entry-point and guide separation was informed by the
[repository documentation reference](https://github.com/Alexays/Lilo/tree/main/docs).
These rules are written for this product and its verification policy.
