# Authentication architecture enforcement and Nest CLI

Date: 29 October 2026. Owner: AUTH-003 coordinator in worktree 015e. Review
amendment to [PR #27](https://github.com/GloupsApp/gloups-health/pull/27), initially
`7ffe95154d67939879b63f4011873853462b2015`, based on assignment/main
`fbe808edcf8c8ce18b2083b0fab5c5af8ee7eac6`. The owner requests checks for
cross-context imports, circular dependencies and narrow Nest exports before
continuing review, and separately asks to install the official Nest CLI. Every
PR remains open for owner review; no source merge or auto-merge is authorized.

## Implementation

The [architecture command](../../tools/architecture/README.md) resolves source
imports through the pinned TypeScript compiler and reads Nest module metadata
without executing product code. It rejects cross-context deep imports, private
barrels, hidden/computed imports/exports, wildcard re-exports, outer-layer aliases,
source cycles including type-only/lazy/re-export edges, and Nest import cycles
including modules in a single file. Context roots expose named application
public APIs; providers must be locally registered. Private SDK/database/HTTP and
platform exceptions match exact owning-module/source/symbol pairs. Entire private
Nest modules cannot be re-exported.

Root check, lint, typecheck/build and pre-commit invoke the command. The checker
itself receives the shared strict TypeScript and Ultracite rules. It adds no
application scaffold, test framework, CI workflow, database or provider resource.
Normal Nest startup still validates provider construction/runtime configuration;
static architecture checks do not establish native/provider acceptance.

Official `@nestjs/cli` 12.0.11 is installed as an exact root development dependency
with the single Bun lock. Registry metadata identifies the official Nest CLI
repository, Node>=20.11 and TypeScript~6.0.2, compatible with the installed 6.0.3.
The owner-linked [official overview](https://docs.nestjs.com/cli/overview.md) was
read directly; it permits a managed alternative to global installation.
`bun run nest --version` returned 12.0.11; installed `generate --help` confirms
`--no-spec`. No project, feature or unit test was generated. Existing
Bun/Turborepo and authored TypeScript pins remain.

## Actual CLI acceptance

After implementation, the coordinator invoked the actual CLI as a subprocess
against 31 isolated temporary API source trees. All 31 produced the expected exit
and diagnostic: two supported boundaries passed and 29 violations were rejected.
These are command/filesystem acceptance probes, not imported-function unit tests
or TDD. Fixture sources and stdout stay in ignored plan-owned state.

| Boundary                 | Actual cases                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Allowed contracts        | Named application public API through alias; public Nest module with locally registered application provider                                                                                      |
| Cross-context rejection  | Relative private domain, aliased infrastructure, namespace import, literal lazy import, import type, literal require, private application barrel                                                 |
| Graph cycles             | Runtime, type-only, lazy and re-export source cycles; same-file and two-file Nest module cycles                                                                                                  |
| Explicit surfaces        | Wildcard barrel, whole-module re-export, root SDK export, hidden export list, spread exports, computed metadata key, provider object export, unregistered export, public domain-entity re-export |
| Other guarded boundaries | Unclassified context source, core Node import, computed loader, forward module factory, aliased domain-to-application leak, platform-to-context leak, indirect module metadata                   |

The first run against a preserved integrated source snapshot correctly reported
`IdentityApplicationModule` re-exporting its whole persistence module. In an
isolated copy of `a5dcaeee340eaa89fe5b89e0bb3fd2462d3bb935`, removing that re-export
and giving actual composition consumers explicit persistence imports passed:
**94 API source files, 14 Nest modules**. No source/type or Nest-module cycle
was present in that reference. This is static evidence; runtime verification of
the dependent slices remains separately recorded in their review handoff.

## PR #27 checkpoint checks

With Bun 1.4.4 and Node 26.13.0 from this lane's existing isolated tooling:

- `bun install --frozen-lockfile`: passed.
- `bun run architecture:check`: passed and explicitly reported 0 API source files
  and 0 Nest modules because PR #27 precedes API scaffolding.
- `bun run turbo run build --dry=json`: four docs/mobile build/typecheck tasks.
- `bun run build`: passed 4/4, two cache hits, 5.308s; root strict compiler and
  architecture command executed. Cached results are not new device evidence.
- Root strict TypeScript compilation of the checker and `bun run check`: passed.
- `bunx ultracite fix/check`: passed 89 code/config files; doctor 8/8, no warnings.
- Official CLI version/help and the 31 actual command acceptance probes passed.

Git diff, local documentation links, path/privacy exclusions and commit hooks
are checked before publication. There are no new unit tests, CI jobs, API/device
journeys or claims of live-provider success in this checkpoint. Existing native,
physical-device, provider, sender and live retention gates remain open.

## Dependent stack and runtime readback

The coordinator normally merged the updated predecessor into each dependent
review branch, checked it and pushed it without rewriting history. All source
PRs remain open/draft for owner review; no main/PR merge or auto-merge occurred.
The [current head map](2026-10-29-authentication-review-stack.md#pr-27-enforcement-amendment-current-review-heads)
records the actual revisions. Every branch passed strict typechecks and the new
architecture/Ultracite gate. API checkpoints #28–35 and recomposed #26 additionally
passed uncached compilation and actual Nest startup/health against the lane's
isolated PostgreSQL; each owned API child was stopped after readiness.

The real export leak is fixed in its owning slices: IdentityApplicationModule
exports only its two use cases. Authentication/social/root-guard composition
import persistence explicitly; HTTP-policy/deletion/worker composition replaces
its indirect application import with persistence. API source differs from the
prior extraction only in those seven wiring files (17 additions, 12 deletions).
No domain/application/infrastructure/presentation behavior, schema/migration or
mobile source was changed.

Final actual API acceptance: `GLOUPS_AUTH003_FAULTS=1 bunx e2e run --target api`,
run `01a187ab-555d-75a8-ab5e-431146e30a36`, **32/32 passed in 25.77s**. This includes
actual API/database restart, the standalone worker's signal/drain lifecycle and
private relay faults. Only the API target ran; the runner's configured native
target names are not native evidence.

`bun install --frozen-lockfile`, actual six-task graph, root build/typechecks,
`bun run check`, Ultracite doctor and Changesets status passed. Root build 6/6,
three cached, 8.187s, executed current API/docs builds and iOS/Android exports.
Architecture passed 94 API source files/14 Nest modules; Ultracite checked 257
code/config files; doctor 8/8 with no warnings. Changesets still reports only the
existing docs patch. No unit tests, TDD, CI or paid/hosted checks were introduced.

After evidence capture, cwd/command-verified lane API, sink and relay processes
were stopped. API-04 intentionally replaced the original API process; its actual
child was verified before cleanup. The labeled owned Postgres service was
stopped and its `gloups-auth-auth003_postgres` volume preserved. Ports 4340/4341/
4342/25440/8085 have no listeners. Ignored environments, reports, builds, device
state and worktree remain preserved; unrelated processes and OrbStack are intact.
Native/provider/physical-device/sender/live-retention gates remain pending.

Final retained-file audit checked 214 paths, 27 Markdown files, 186 local links and
12 anchors. No private material or generated-native/unit/workflow path entered
the diff. Actual Git comparison confirms domain/application/infrastructure/
presentation, migrations and mobile source are unchanged from the prior source;
only the seven named Nest wiring files differ. Hooks run the architecture gate
and staged formatting before the final documentation commit.
