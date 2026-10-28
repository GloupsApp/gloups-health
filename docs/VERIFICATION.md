# Verification

## Current repository

Workspace tooling and a local documentation site exist. Check Git diffs, local
Markdown targets and anchors, instruction consistency, task ownership, confirmed/proposed choices,
reference-name exclusions and secret/data hygiene. Record actual commands/results
under [verification](verification/README.md). TOOL-001 adds frozen Bun installs,
Ultracite checks, Turborepo documentation builds, Changesets status and real hook
checks. No product app check can pass before its app or task exists.

## Future behavior

| Slice                    | Required boundary                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API                      | Running NestJS HTTP service with isolated PostgreSQL; accepted values, auth/isolation, retries, concurrency, persistence, restart and failure paths          |
| Native UI                | Actual app on a regular iPhone, iPhone Duo and relevant Android device/emulator; actual runtimes and journey limits recorded                                 |
| Native health/background | Physical-device health imports, source edits/deletions, permissions, lock/background/process death, timers and sync                                          |
| Coaching                 | Real authorized context/action boundaries, numeric consistency, missing/stale context, adversarial record text, provider failures and reviewed quality cases |
| International            | French/English, regional formats, units, zones/DST/travel, overnight dates, decimal input, store/currency/market coverage                                    |
| Data/security            | Export/deletion across new domains/media/chat/queues, audit access and a protected isolated restore                                                          |

Use E2E Army (Tester Army). Agents do not write, extend or rewrite unit tests and
do not use TDD. Exact expected numeric and persistence behavior belong in the
accepted contract. Controlled provider HTTP services can exercise failures; real
model identity/quality and actual platform integrations need separate evidence.

Evidence identifies revision, exact commands, process/database/provider boundary,
synthetic identities, device/runtime, outcome and remaining limitations. A bundle
export is not Android device acceptance, local generation is not offline chat
unless the whole journey works offline, and a source module is not a shipped flow.

Static builds, typechecks, lint and formatting remain useful after tooling exists.
Run relevant checks once they pass; repeat only for new changes or unresolved
failures. GitHub Actions usage is exhausted. Do not add a workflow or wait for CI
as a substitute for local evidence.
