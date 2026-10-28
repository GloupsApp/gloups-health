# Verification

## Current repository

Workspace tooling, a local documentation site and a minimal Expo SDK 58 mobile
shell exist. Check Git diffs, local
Markdown targets and anchors, instruction consistency, task ownership, confirmed/proposed choices,
reference-name exclusions and secret/data hygiene. Record actual commands/results
under [verification](verification/README.md). TOOL-001 adds frozen Bun installs,
Ultracite checks, Turborepo documentation builds, Changesets status and real hook
checks. No product app check can pass before its app or task exists.

TOOL-002 adds `bun run typecheck` for the root tooling configs and the docs
configuration. Builds require the relevant compiler checks, and both projects
inherit `tsconfig.base.json`. Verify effective settings with
`bun run tsc --project tsconfig.json --showConfig` and
`bun run tsc --project apps/docs/tsconfig.json --showConfig`.
The shared base checks declarations. The docs project has an explicit exception
for published dependency declaration errors; see
[CODE-STANDARDS](CODE-STANDARDS.md#typescript-configuration) and the
[TypeScript evidence](verification/2026-10-28-strict-typescript.md).

TOOL-003 adds mobile typechecking, SDK dependency/config checks and iOS/Android
Metro exports through `bun run mobile:build` and the root build. Verify effective
settings with `bun run tsc --project apps/mobile/tsconfig.json --showConfig`.
Mobile source inherits the shared strict checks; its separate declaration
exception and the actual bundling/server evidence are recorded in the
[Expo verification record](verification/2026-10-28-expo-foundation.md).
The empty shell has no product journeys. Native device and E2E Army acceptance
are required when those journeys are implemented; bundle exports do not replace it.

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
