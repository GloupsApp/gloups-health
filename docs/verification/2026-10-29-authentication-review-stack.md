# Authentication architecture and review stack

Date: 29 October 2026. Owner: AUTH-003 coordinator in 015e. Base source:
`ada0ca072384bec24557af2d43cb853165b65fce`; main assignment:
`fbe808edcf8c8ce18b2083b0fab5c5af8ee7eac6` (PR #25). The owner requested use of
Nest's full documentation, stronger DDD/Onion boundaries and concern-focused
review PRs after finding PR #26 too large. The approved authentication scope and
no-merge/no-auto-merge rule remain; no new product behavior is inferred.

## Source correction

The prior folders kept imports inward, but did not adequately separate wiring,
transaction ownership, transport validation or worker setup. The refactor adds:

- Small private Nest modules and explicit exports for identity persistence/use
  cases, authentication, credential HTTP, social HTTP and deletion. The public
  feature root exports no SDK/database resource.
- Validated ConfigModule composition and official named DrizzleModule databases;
  readiness and connection shutdown use Nest lifecycle hooks. Bootstrap has no
  direct feature SDK/database lookup.
- APP_GUARD/APP_FILTER bindings, typed current-actor decorators, schema-backed
  pipes and origin/budget guards. Controllers no longer call SDK APIs or import
  Drizzle implementations. Protocol gateways preserve official SDK responses.
- Separate account/deletion work ports, with aggregate beginDeletion/save and
  immutable identity-pair checking. Core is plain TypeScript; actual Oxlint
  overrides enforce inward imports and exclude persistence from presentation.
- A Nest standalone worker graph sharing deletion providers, with current-tick
  draining before managed database shutdown. SDK policy/request effects/DB
  hooks/proof admission/fingerprints are separate leaf adapters.
- Concern-focused real E2E suites and explicit generated-metadata review rules.
  Authored SQL stays visible. No unit tests, TDD or production setup.

## Observed checks

Official registry metadata verified new exact dependencies: @nestjs/config 12.0.1
and @nestjs/drizzle 0.0.2. Both declare Nest 12 compatibility; the Drizzle peer
range includes existing 0.45.4. postgres.js 3.4.9 is unchanged. The official full
Nest documentation and Drizzle/configuration/module/lifecycle/standalone/pipe
chapters were read. No separate authentication engine was introduced.

The first boot identified a missing config import in the deletion HTTP module;
the scoped DI binding was corrected. Splitting SDK policy identified a private
request-scope reference; a narrow getter keeps the storage private. No failed
build or boot establishes acceptance. The corrected API compiled uncached.

Army actual HTTP/Postgres run 01a18721-087a-71d1-9763-1fbc1eb77d42:29/29 in 25.56s.
After aggregate persistence and suite extraction,
run 01a18728-8a38-77c9-8049-1863ed8b9de3:31/31 in 27.82s. Added platform cases
exercise real Nest/Fastify health after readiness and credential-capable CORS.
Worker drain run 01a1872c-8701-7fba-add1-1acf052a0c49:1/1 in 3.43s. Drizzle Kit
reports no schema changes, nothing to migrate. Root strict checks and API
compilation pass; new lint configuration doctor reports 8/8 with no warnings.

The published branch/PR map and checkpoint evidence follow below. Live provider/native/sender/retention acceptance
remains pending; compilation or source restructuring does not supply it.

## Decisions and costs

- Keep the accepted behavior while correcting architecture and review granularity
  under the existing owner assignment — this is direct owner feedback within the
  approved packet — source/device/provider acceptance remains a separate gate.
- Keep core classes plain and bind them with Nest factories at composition — DDD
  requires inward contracts while Nest manages adapters and runtime lifecycle —
  decorators on core use cases are intentionally unnecessary.
- Use official ConfigModule/DrizzleModule, retaining the stable ORM and driver —
  named DI and managed lifecycle now have first-party support — the new exact
  dependencies need startup/shutdown and compatibility evidence.
- Retain the SDK's scoped protocol bridge and narrow gateways — raw bodies,
  redirects and cookie chunks are protocol contracts — those endpoints retain
  SDK-owned middleware while application commands use Nest's pipeline.
- Put public Apple budgets in Nest guards before body pipes — admission runs
  before payload work in the standard pipeline — malformed requests also consume
  their route budget; payloads/identities are never logged.
- Make the account aggregate transition part of deletion persistence — folder
  placement alone cannot enforce a domain invariant — transaction and race
  checks remain required over the real database.
- Split review through cumulative branches while preserving original source
  history — each diff must isolate one concern without breaking dependencies —
  review/merge order matters and every PR stays unmerged for the owner.
- Collapse only generated lock/snapshot metadata — owner review must focus on
  authored changes while retaining expandability — SQL remains fully visible.
- Preserve existing missing native/provider/physical-device and live release
  prerequisites — this refactor adds no live credentials or device evidence —
  release remains blocked until those independent gates are satisfied.

Final integrated source run `01a18735-52ac-7263-b2e3-b421916baeee`: **32/32**
actual HTTP/Postgres E2E checks passed in 28.72s, including signal-driven worker
draining. Root build passed 6/6 (3 cached) in 9.099s; API compilation and current
iOS/Android exports executed. Root strict tooling checks executed; unchanged
workspace typechecks used their recorded cache results. Ultracite fix/check
passed 252 files; doctor 8/8, no warnings. The authored source adds no schema
change. Mobile source is unchanged from the prior review; new native/provider
acceptance is not claimed. The source is preserved before extracting branches.

Verified refactor source: [`61f25e6a02a62445b711d7fa5edce5499a081451`](https://github.com/GloupsApp/gloups-health/commit/61f25e6a02a62445b711d7fa5edce5499a081451),
preserved on `codex/auth-003-nest-boundaries` before review extraction. The
follow-up documentation commit includes the API module guide. A retained/new-file
scan of the complete source diff checked 206 paths against private environment
material and excluded private/generated/unit-test paths. Deleted paths were
excluded from content lookup. Husky staged formatting and commitlint passed.

## Review order and exact revisions

Start at [PR #27](https://github.com/GloupsApp/gloups-health/pull/27). Each later
PR targets the preceding review branch, so its Files changed view isolates the
listed concern. Every PR is draft and intended for owner review; no agent merge
or auto-merge is authorized. The owner controls integration in this order.

The line counts below count additions plus deletions and exclude only generated
`bun.lock` and Drizzle snapshot metadata. SQL, runtime source and E2E cases remain
visible. The credential/deletion slices include their actual HTTP/Postgres E2E
cases, not unit tests. Platform-only cases on early private modules establish
startup/DI, not authentication acceptance. Native exports establish compilation,
not device/provider success.

| Review PR                                                 | Concern                                                             | Base PR    |            Authored lines | Verified revision                                                                                       | Local checkpoint                               |
| --------------------------------------------------------- | ------------------------------------------------------------------- | ---------- | ------------------------: | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [#27](https://github.com/GloupsApp/gloups-health/pull/27) | Architecture, import rules and review policy                        | main / #25 |                      2657 | [`7ffe951`](https://github.com/GloupsApp/gloups-health/commit/7ffe95154d67939879b63f4011873853462b2015) | Root build 4/4; lint/doctor; local links       |
| [#28](https://github.com/GloupsApp/gloups-health/pull/28) | Fastify platform, validated config and managed Drizzle DI           | #27        |                       572 | [`5bcfd04`](https://github.com/GloupsApp/gloups-health/commit/5bcfd0482232131862fe04ed4426a2ca972dda99) | Strict compile/build; platform 2/2             |
| [#29](https://github.com/GloupsApp/gloups-health/pull/29) | Plain account domain, core ports and use cases                      | #28        |                       290 | [`3e2ccc0`](https://github.com/GloupsApp/gloups-health/commit/3e2ccc04fdfcb707b3457894b88dd2863c5c86d7) | Strict compile/build; platform 2/2             |
| [#30](https://github.com/GloupsApp/gloups-health/pull/30) | Drizzle repositories, unit of work and SQL history                  | #29        |                       891 | [`57f59bb`](https://github.com/GloupsApp/gloups-health/commit/57f59bbb6759a203fce8b57474171d2e51ad5bc6) | Strict compile/build; platform 2/2; migrate    |
| [#31](https://github.com/GloupsApp/gloups-health/pull/31) | Private official Better Auth adapter and protocol gateway           | #30        |                       241 | [`77d8b64`](https://github.com/GloupsApp/gloups-health/commit/77d8b64b5a6ac9b2fec9ea58cf97fa3a2b8d7711) | Strict compile/build; platform 2/2             |
| [#32](https://github.com/GloupsApp/gloups-health/pull/32) | Email delivery, issuance proofs and SDK policy hooks                | #31        |                      1028 | [`bb42f4a`](https://github.com/GloupsApp/gloups-health/commit/bb42f4a1d6c5406bc08a674613c7900206e4afdc) | Strict compile/build; platform 2/2             |
| [#33](https://github.com/GloupsApp/gloups-health/pull/33) | Nest credential/session pipeline and real API cases                 | #32        |                      1742 | [`493e1ad`](https://github.com/GloupsApp/gloups-health/commit/493e1ad8800727b082163807c5fcaebf43f28d08) | Strict compile/build; HTTP/Postgres 22/22      |
| [#34](https://github.com/GloupsApp/gloups-health/pull/34) | Google/Apple adapters, native exchange and linking                  | #33        |                      1106 | [`7c8bbbd`](https://github.com/GloupsApp/gloups-health/commit/7c8bbbd6b3aa867f758596fa879122c73f96ef6f) | Strict compile/build; HTTP/Postgres 23/23      |
| [#35](https://github.com/GloupsApp/gloups-health/pull/35) | Account deletion, durable work and standalone Nest worker           | #34        |                      2059 | [`a798078`](https://github.com/GloupsApp/gloups-health/commit/a798078d08393aa98f569e1a4d57331a6209b956) | Strict compile/build; HTTP/Postgres 31/31      |
| [#36](https://github.com/GloupsApp/gloups-health/pull/36) | Official Expo client, secure storage and generations                | #35        |                       655 | [`28755ed`](https://github.com/GloupsApp/gloups-health/commit/28755edb262c44b59d070614fcdc7ad88fe46419) | Strict compile; API build; iOS/Android exports |
| [#37](https://github.com/GloupsApp/gloups-health/pull/37) | Native Apple/browser social and lifecycle adapters                  | #36        |                       282 | [`8d068df`](https://github.com/GloupsApp/gloups-health/commit/8d068df5fc260c0e88a698042b2147e06c2e62c8) | Strict compile; API build; iOS/Android exports |
| [#38](https://github.com/GloupsApp/gloups-health/pull/38) | Session/account ownership, language and controller state            | #37        |                       835 | [`55a0b16`](https://github.com/GloupsApp/gloups-health/commit/55a0b1624586fa2ca682fefe4602f6f65e1de47d) | Strict compile; API build; iOS/Android exports |
| [#39](https://github.com/GloupsApp/gloups-health/pull/39) | Credential routes, bilingual forms and recovery                     | #38        |                      1187 | [`4e8ffbb`](https://github.com/GloupsApp/gloups-health/commit/4e8ffbb146506bcee99e052063f4f61fe4dd0504) | Strict compile; API build; iOS/Android exports |
| [#40](https://github.com/GloupsApp/gloups-health/pull/40) | Account methods, sign-out and deletion screens                      | #39        |                       317 | [`ad16d20`](https://github.com/GloupsApp/gloups-health/commit/ad16d2058b93a691d12a6a6d0949ec77c403622b) | Strict compile; API build; iOS/Android exports |
| [#41](https://github.com/GloupsApp/gloups-health/pull/41) | Native journey definitions and launch configuration                 | #40        |                       972 | [`dd1a925`](https://github.com/GloupsApp/gloups-health/commit/dd1a925bba0be6007b033dbe8fbba2d3a3d44274) | Strict compile; API build; iOS/Android exports |
| [#26](https://github.com/GloupsApp/gloups-health/pull/26) | Private fault relay, interrupted-session journeys and final handoff | #41        | Recorded in final PR diff | Final head in PR                                                                                        | Integrated evidence below                      |

The exact remote branches are the PR heads; all use the
`codex/auth-003-review-` prefix except the retained original
`codex/auth-003-official-auth` for #26. PR #29 is the additional pure-core split;
#30 contains the persistence concern. The wider original ten-step decomposition
was narrowed during extraction without adding product behavior.

PR #26 preserves its original commits. The review stack was merged into that
local feature branch at `a7f42675abc97b81aadbe55ea085681d62383747` to preserve ancestry
without rewriting or force-pushing history. This is a local branch integration;
no GitHub source PR or main branch was merged. Its new base is #41. Its review
diff contains no API/mobile application source.

## Checkpoint evidence

Each extraction was built and checked before push. All checkpoints ran
`bun run typecheck`, `bunx ultracite fix` and `bunx ultracite check`. API checkpoints
ran `bun run api:build`; mobile checkpoints also ran `bun run mobile:build` with
both platform exports. Dependency changes passed `bun install --frozen-lockfile`.
The following Army runs used the running lane API and isolated Postgres 18.6;
no fake provider success or external mail was involved.

| PR  | Army run                               | Result                                 |
| --- | -------------------------------------- | -------------------------------------- |
| #28 | `01a1874f-5861-7bdc-b76d-ac020e78c055` | 2/2 platform                           |
| #29 | `01a18755-7242-747b-9d5c-463cc8de819e` | 2/2 platform                           |
| #30 | `01a18759-67a2-7d8a-9727-8dc22271b1b6` | 2/2 platform; migration rerun succeeds |
| #31 | `01a1875c-e2c0-7b26-b535-6da60e8e1a47` | 2/2 platform; SDK remains private      |
| #32 | `01a1875e-4392-7978-890a-1ec5671627cb` | 2/2 platform; SDK remains private      |
| #33 | `01a18760-4908-7fa9-8e2f-97c2a52b4487` | 22/22, 10.41s                          |
| #34 | `01a18764-69b6-7dde-b560-991232f76db5` | 23/23, 10.79s; provider boundary only  |
| #35 | `01a18766-1847-70c2-bc10-5b1633c6033b` | 31/31, 26.78s                          |

The final #41 API/mobile source, root manifests/lock, TS/E2E configuration and
architecture lint rules match preserved extraction revision
`2ee345cbd91db144d1210d999c0e983453200d3c` byte for byte. The API source already
matches at #35. The final #26 adds the remaining four fault-harness files and
review/handoff documentation. Source equality is checked with the actual Git
diff, rather than inferred from commit messages.

## Remaining acceptance and resumption

AUTH-003 stays Review. Live Google/Apple success, signed notifications/revocation,
physical iPhone credential state, the complete regular iPhone/Duo/Android matrix,
accessibility/delayed-storage journeys, external sender and live release retention
remain pending as recorded in the [original execution evidence](2026-10-28-authentication-execution.md).
The native case definitions and successful exports do not close these gates.
The host lock requires the owner's manual unlock before native UI automation.
Provider/HTTPS/device inventory remains requested; no registration, purchase,
deployment, distribution or live data migration was performed.

Use the API/mobile READMEs and the [API](../../e2e/api/authentication.md) / [native
case records](../../e2e/mobile/authentication.md) for actual start commands and
remaining journeys. Keep ignored local environments, reports, generated debug
builds, device data, the worktree and the synthetic database volume. No other
lane's checkout, process or device is part of this handoff.

## Final recomposition verification

After preserving review ancestry on the original feature branch, the coordinator
ran `bun install --frozen-lockfile`, `bunx ultracite fix`,
`bun run turbo run build --dry=json`, `bun run build`, an uncached
`bun run --filter @gloups/api build`, `bunx ultracite check`,
`bunx ultracite doctor` and `bun run changeset:status` from the repository root.
All passed. The graph has six API/docs/mobile build/typecheck tasks; the final
Turbo build replayed six cache results (25ms), while root tooling TypeScript and
the additional API compilation executed. Earlier checkpoint #41 executed the
mobile iOS/Android exports; the cached final build is not new native evidence.
Ultracite checked 252 files; doctor passed 8/8 with no warnings. Changesets still
contains only the existing documentation patch. No unit tests or CI were run.

The API was restarted from the newly emitted code before running
`GLOUPS_AUTH003_FAULTS=1 bunx e2e run --target api`.
Army run `01a1877b-a7c7-72df-9207-9683db912086` passed **32/32** in **25.93s**
across seven real HTTP/Postgres suites, including the signal-driven standalone
worker drain and private fault relay. Only the API target ran; the runner's
configured native targets did not establish device acceptance. The application
source/manifests remain byte-identical to the preserved verified reference.

After this run, only cwd/command-verified lane API 4340, sink 4341 and relay 4342
processes were stopped. The Compose project/service labels were verified before
stopping its Postgres container. Ports 4340/4341/4342/25440/8085 have no listeners;
volume `gloups-auth-auth003_postgres` remains present. Ignored mode 0600 environments,
reports, generated debug builds, device state and the worktree remain preserved.
No native device or unrelated process was started/stopped in this refactor pass.
OrbStack remains untouched. Resume through the existing READMEs after the owner's
review and the outstanding native/provider prerequisites.

The retained/new-file diff audit checked 207 paths against private environment
material, 24 Markdown files, 165 local links and eight anchors. No private,
generated-native, workflow or unit-test path entered the source diff. Import
direction checks passed through the configured architecture lint rules. The
actual #41-to-final diff has no API/mobile application-source changes.
