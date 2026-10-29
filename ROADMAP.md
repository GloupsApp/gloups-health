# Gloups engineering roadmap

Updated 29 October 2026. Worldwide iOS/Android launch, with French and English
first. Nutrition, full workout creation/execution, sleep, optional cycle tracking
and explained daily food/training/rest recommendations are launch requirements.
See [PRODUCT](docs/PRODUCT.md) and the [design draft](docs/specs/2026-10-27-unified-health-coach-design.md).

## Current state

This repository has engineering documentation, Bun/Turborepo tooling, a local
Blume site and AUTH-003 authentication source for NestJS/Fastify/Drizzle/Postgres
and Expo SDK 58. The local API has actual credential/lifecycle E2E evidence;
complete native/provider acceptance is pending in the open source PR. Health and
product web flows remain reserved. The prior applications remain source references.
No product feature is In Progress or Complete merely because a source module
exists. Dated verification records describe the actual checks.

## Proposed sequence

| Milestone | Work                                                                                                     | Exit evidence                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| M0        | Scope, international contracts, service choices, scientific methods, privacy responsibilities and budget | Accepted decisions/contracts and explicit owners for unresolved items                                                      |
| M1        | NestJS service, account boundary, nutrition/hydration parity, data protection and recovery               | Real HTTP values, account isolation, retries, persistence and isolated restore                                             |
| M2        | Workout programming, live sets, timers, offline recovery and progression                                 | Actual phone journeys, including background/lock/process death and denied permissions                                      |
| M3        | Health ingestion on both platforms, sleep/naps/corrections and optional cycle/symptoms                   | Real imports, edits/deletions, provenance, duplicates, missing data, permissions and international dates                   |
| M4        | Connected daily coach, explanations, accepted actions and weekly review                                  | Cross-domain evidence, numeric consistency, context invalidation, quality/cost/latency and provider failures               |
| M5        | Worldwide release readiness in French and English                                                        | Native acceptance, accessibility, market/locale coverage, consumer privacy/security and actual store/distribution evidence |

M2 and M3 may progress independently after their shared contracts are accepted.
All launch domains remain required. A partial development beta must state what
is missing. HIPAA BAA/HDS support belongs to a possible later offering.

The [task registry](docs/tasks/README.md) tracks engineering work and ownership.
The public roadmap remains [Canny](https://gloups.canny.io), on Free. The
[bilingual cards](docs/marketing/roadmap/2026-10-27-unified-health-coach.md) are drafts,
not live Canny entries. Use Planned only for selected work, In Progress only for
started implementation and Complete only with acceptance and an availability
statement. Do not copy external votes, comments, dates or statuses.

## Later candidates

Deeper meal planning, shopping and batch cooking; watch execution; widgets;
direct device integrations; advanced trends and additional validated metrics.
Watch, GPS and structured endurance launch scope still need a founder decision.
Medical records, illness prediction, medication advice and fertility decisions
require their own intended-use and evidence review.
