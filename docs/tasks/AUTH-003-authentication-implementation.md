# AUTH-003: Native execution of the approved authentication plan

Status: Review; source PR #26 open, complete native/provider acceptance pending.
Assignment PR #25 merged and read back at
`fbe808edcf8c8ce18b2083b0fab5c5af8ee7eac6` on 29 October 2026. Owner and integration coordinator: Codex, current
authentication chat `01a1842f-75ee-7d31-a619-daeedf78f882`.

## Intent and approved inputs

On 28 October 2026 the owner selects native execution of the
[implementation plan](../plans/2026-10-28-authentication-implementation.md),
delivered in [PR #24](https://github.com/GloupsApp/gloups-health/pull/24), revision
`c8be0f671c1cfe88c362dda78f9873f08b3859cc`. The
[design](../specs/2026-10-28-authentication-design.md) is already approved under
D017. Do not request design or stack approval again.

Use NestJS's official Fastify adapter, Drizzle ORM/PostgreSQL, DDD/Onion and only
official Better Auth/Expo integrations. Implement Google, native Apple on iOS,
browser Apple on Android and email/password with the approved lifecycle behavior.
Follow plan Tasks 0–7 sequentially in this chat; no implementer delegation.
A fresh whole-branch reviewer is permitted by the selected executing-plans skill.
No agent-written/modified unit tests or TDD; use the required real-boundary evidence.

The owner changes Git delivery: create PRs for owner review, leave them unmerged,
and do not enable auto-merge. This includes assignment and feature PRs. D018
records the exception to prior automatic-integration instructions. Only a later
explicit owner instruction can authorize an agent merge.

## Ownership and branches

Repository: `git@github.com:GloupsApp/gloups-health.git`.
Worktree: `/Users/maximebourmaud/.codex/worktrees/015e/gloups-health`.
Initial main base: `c8be0f671c1cfe88c362dda78f9873f08b3859cc`.
Assignment branch: `codex/auth-003-assignment`.
Execution branch: `codex/auth-003-official-auth`, created from the owner-merged
assignment/main revision. Keep this existing isolated worktree; no other checkout
or worker resource may be reused. Record the actual execution base before code.

The coordinator retains shared-file integration. This packet owns only the
authentication slice; FND-001 and the health-domain packets stay unassigned.

## Allowed paths

The plan's task file lists are the exact source manifest. Paths below bound
those lists; a wildcard permits generated migration names or the listed auth
files, not unrelated features.

- Root `package.json`, `bun.lock`, `turbo.json`: declared API/mobile dependencies
  and root script/task wiring only. Preserve the pinned Bun/shared TS baseline.
- `apps/api/AGENTS.md`, `apps/api/package.json`, `apps/api/.node-version`,
  `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`,
  `apps/api/drizzle.config.ts`, `apps/api/compose.local.yaml`,
  `apps/api/.env.example`, `apps/api/README.md`.
- `apps/api/src/{main.ts,app.module.ts,config.ts,deletion-worker.ts}`,
  `apps/api/src/local-only/email-sink.ts`, the explicitly listed files under
  `apps/api/src/modules/identity-access/{domain,application,infrastructure,presentation}/`
  and its outer `identity-access.module.ts`.
- Generated, reviewed `apps/api/drizzle/**` SQL/metadata and auth schema at the
  plan's specified path. Do not hand-edit generated schemas or commit databases.
- `apps/mobile/{package.json,index.ts,app.json,app.config.ts,tsconfig.json,README.md}` and replacement of its empty `src/app.tsx`.
  The plan's exact route files under `apps/mobile/src/app/`, feature files under
  `apps/mobile/src/features/auth/` and canonical `apps/mobile/src/design/colors.ts`.
- `e2e/api/authentication.md`, `e2e/mobile/authentication.md`: case/evidence records
  for the connected Army runner; no agent-written unit tests or invented harness.
- This packet, `docs/tasks/README.md`, AUTH-002's execution handoff,
  `docs/plans/2026-10-28-authentication-implementation.md`, `docs/DECISIONS.md`,
  `docs/SERVICES.md`, `docs/DESIGN.md`, and
  `docs/verification/2026-10-28-authentication-execution.md` plus its index.
- Root `AGENTS.md` and the authentication-specific delivery note in
  `docs/AGENT-WORKFLOW.md` for D018 review-first delivery. No weakening of scope,
  data, no-unit-test or acceptance rules is permitted.

No product web, health domain, operator surface, shared contract package, other
worker packet, production configuration or CI workflow is included. Existing
identity/provider resources and source data must be preserved. Paid provider
changes, app registration, deployment, distribution and messages to people remain
outside authorization.

## Contracts and execution resources

Consume the plan's named ports/types and approved values. Produce the `/api/me`
account boundary, supported auth protocol, native exchange, lifecycle/deletion
boundary and en/fr mobile journeys. Domain/application stay plain TypeScript;
SDK/HTTP/ORM types and concrete transactions remain in outer adapters. All actor
ownership comes from server-verified identity. Library auth records never become
Gloups domain entities.

Proposed lane resources: API `4340`, PostgreSQL `25440`, local email sink `4341`,
Metro `8085`, Compose project/volume `gloups-auth-auth003`. These names are not
proof of a running service or exclusive reservation until execution preflight
records occupancy/ownership. No resource may be taken from another lane.

Runtime/dependency/image targets are the reviewed plan pins; recheck compatibility
before installation and record any necessary change rather than silently changing
the stack. Local secrets go only into ignored state, never terminal output/Git.

## Acceptance and ordered gates

1. The owner explicitly authorized merging assignment PR #25 on 29 October.
   It is merged and read back; that main-assignment gate is satisfied. Every
   source PR remains open for owner review and merge.
2. Record runtime/database/port/tool availability and Task 0 prerequisites.
   Missing Army/provider/device evidence is not a reason to invent a passing check.
3. Execute Tasks 1–4 in order, including Fastify raw bodies/cookies, Drizzle-owned
   migrations, unique ownership, email lifecycle, native Apple credentials and
   durable deletion. Follow each named API/mail/social/lifecycle/deletion case.
4. D019 removes the Mobbin prerequisite. Before Task 5 flow source, verify/import
   the canonical palette. Before live providers, inventory authorized credentials,
   callback environment, sender/test recipients, native identifiers and devices.
5. Execute Tasks 5–6 with real regular iPhone, iPhone Duo and Android acceptance;
   physical iPhone evidence covers Apple credential state. No exports-only success.
6. Record retention/re-registration decisions before real-data/deletion release
   acceptance. Continue independent authorized static work where the plan allows,
   while leaving affected acceptance incomplete.
7. Run relevant static gates, the full required integrated matrix and one fresh
   whole-branch review under the selected skill. Fix actionable findings without
   unit tests/TDD; evidence must respect the repository's actual E2E policy.
8. Commit/push and open focused PRs for the owner. Never merge or enable auto-merge.
   Keep status Review while integration/evidence is pending; do not label the
   authentication product Done because an assignment or draft PR exists.

## Handoff and preflight

Task 0 has started; source implementation has not. Existing linked worktree and
remote identity were verified. Host Node is `26.12.1`, versus the planned target
`26.13.0`; pinned Bun `1.4.4` is available. Docker client `29.9.2` exists, but the
OrbStack daemon reports Stopped and the configured socket is absent. No Docker
daemon/container was started. No listener was found on the four proposed ports.

Tool inventory and plugin search found no E2E Army/Tester Army or Mobbin plugin.
Expo automation capabilities exist but were not used as a substitute for required
Army/device evidence. No device, provider, email, application or database check ran.

The selected skill's ignored execution ledger is scoped to this plan. It records
the no-TDD policy override, review-first Git delivery and pending main-assignment
gate. Record assignment PR/checks and actual merged execution base before
continuing; preserve this worktree and all user-owned ignored state.

## Assignment review handoff

[PR #25](https://github.com/GloupsApp/gloups-health/pull/25) is open for owner
review; no agent merge or auto-merge is authorized. Initial assignment commit:
[`7425b13155979ca9404a2ce4e8201ccd8488cc39`](https://github.com/GloupsApp/gloups-health/commit/7425b13155979ca9404a2ce4e8201ccd8488cc39).

Pinned frozen install, existing-workspace typecheck, Ultracite, diff and local
link/scope checks passed; details are in the
[execution evidence](../verification/2026-10-28-authentication-execution.md).
Husky staged formatting and Conventional Commit hooks passed. The PR contains
documentation only. Source remains unstarted pending the owner-merged assignment
or an explicit owner change to the main-assignment prerequisite. Native execution
and the approved stack are already settled.

## 29 October execution amendments

Execution base: `fbe808edcf8c8ce18b2083b0fab5c5af8ee7eac6`, branch
`codex/auth-003-official-auth`. The owner explicitly authorized the assignment
merge only, removed Mobbin and approved the API-local declaration exception
(D019). Corresponding owned paths include `docs/CODE-STANDARDS.md`,
`apps/mobile/AGENTS.md`, `.gitignore`, root `tsconfig.json`, `oxlint.config.ts`,
`e2e.config.ts` and
actual HTTP/device E2E cases/helpers under `e2e/api/` and `e2e/mobile/`. The owner
authorizes installing the official TesterArmy runner/mobile engine, not a unit
harness or paid cloud resource. Root scripts/dependencies/lock changes serve
those actual test consumers. The coordinator may update the current-state
paragraphs in `docs/README.md` and `docs/ARCHITECTURE.md` to match implemented work.

Task 1/2 source is underway. Node 26.13.0 is checksum-verified in isolated temp
tooling; this lane owns API 4340, Postgres 25440, sink 4341 and future Metro 8085.
Only the local synthetic Postgres service/volume is created. The official `e2e`
0.21.3 and `@e2e-dev/mobile` 0.12.4 are installed; their CLI/docs were inspected.
No model-provider login or paid device session was started. Provider credentials,
physical-device identity and release retention remain unverified dependencies.
Earlier preflight/review paragraphs are the dated assignment history.

### Initial backend checkpoint

Tasks 1/2 have a runnable local API, reviewed/generated Drizzle history, account
ports/use cases, verified session guard, bilingual synthetic email handoff and
credential lifecycle. Initial API E2E passes 12/12 at run
`01a184bd-041c-75df-963c-2a37201b87fc`; see the case/evidence records. Root build,
typechecks, frozen install, Ultracite check/doctor, graph and Changesets status
passed. This is a checkpoint: remaining transport/restart/failure acceptance and
Tasks 3–7 are not Done. The API and sink are running on this lane's 4340/4341 and
Postgres on 25440. No physical device or provider success is claimed.

Source checkpoint: [draft PR #26](https://github.com/GloupsApp/gloups-health/pull/26),
commit [`f698a8d5b4a6dcfcebbcad0488def163b118a4f3`](https://github.com/GloupsApp/gloups-health/commit/f698a8d5b4a6dcfcebbcad0488def163b118a4f3).
It remains open and unmerged while native execution continues; no auto-merge.

### Social and deletion source checkpoint

Task 3/4 source and reviewed migrations implement official provider/native/link/
notification boundaries and durable deletion. Army run
`01a184de-e508-700d-8f49-61e9fec8a402` passed 19/19 real HTTP/Postgres cases.
Live providers, Apple handoff/notification/revocation evidence, full transport and
device matrix remain incomplete. Synthetic local retention is explicit and does
not approve live release. Continue Expo Tasks 5/6 on this branch; no PR merge or
auto-merge is authorized.

### Native source and verification continuation

Tasks 5/6 source adds official Expo Router/SecureStore/native Apple, English/French
credential/social/method/deletion journeys and a retired-generation storage/request
boundary. Compatible installed patches are Expo 58.0.21 / system-ui 58.0.7;
official Localization 58.0.5, UI 58.0.25 and development-client 58.0.17 have actual
consumers. Generated native projects/binaries remain ignored. Local native builds
succeed; complete native/provider acceptance is still pending.

The packet also owns loopback `4342` for a private test-only transparent HTTP
relay under `e2e/mobile/helpers/`. It holds real API responses or cuts connections
for MOBILE-03/04/05; it introduces no product endpoint or fake provider success.
The coordinator verified that port was free before reservation. All upstream
traffic stays within this lane's actual synthetic API/Postgres boundary.

The computer-use tool reports that the Mac is locked. Manual unlock is requested;
no lock bypass or native acceptance is claimed. Continue source/static/API review
while waiting. Existing provider/HTTPS/physical-device inventory and live release
retention decisions remain separate prerequisites. Source PR #26 remains open,
unmerged and without auto-merge.

The coordinator also owns authentication-specific current-state corrections in
root `README.md`, `ROADMAP.md`, `AGENTS.md`, `docs/VERIFICATION.md` and
`docs/CONTRACTS.md`. These replace the obsolete empty-shell/API-reservation notes
with the implemented source and incomplete acceptance state; they do not approve
another domain, public availability or a new shared package.

### Review fix checkpoint

One fresh whole-branch review raised four Important findings; the coordinator
fixed native callback normalization, proof-lock admission order, orphan retry/
expiry cleanup and invalid verification recovery in one pass. Army run
`01a18562-bd71-7301-92e4-afe51ee347b9` passed 29/29 actual HTTP/Postgres cases
in 21.12s. Generated migration 0005 was reviewed/applied to the isolated database.
The [execution record](../verification/2026-10-28-authentication-execution.md)
contains all review decisions, costs and remaining acceptance. No complete task,
native/provider acceptance or release readiness is claimed; PR26 stays draft,
open and unmerged for owner review.
