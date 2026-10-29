# AUTH-003: Native execution of the approved authentication plan

Status: Review of execution assignment. Source work starts after this assignment
is merged on main and read back. Owner and integration coordinator: Codex, current
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

1. Assignment is owner-reviewed, merged on main and read back before source work,
   as required by AGENT-WORKFLOW and plan Task 0. The agent does not merge it.
2. Record runtime/database/port/tool availability and Task 0 prerequisites.
   Missing Army/provider/device evidence is not a reason to invent a passing check.
3. Execute Tasks 1–4 in order, including Fastify raw bodies/cookies, Drizzle-owned
   migrations, unique ownership, email lifecycle, native Apple credentials and
   durable deletion. Follow each named API/mail/social/lifecycle/deletion case.
4. Before Task 5 flow source, inspect actual Mobbin references and verify/import
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

## Owner-requested review decomposition

On 29 October the owner requested stronger use of NestJS and proper DDD/Onion
boundaries for the first module, and smaller concern-focused PRs replacing the
review surface of PR #26. The existing coordinator and merged AUTH-003 assignment
continue; approved behavior, official-only integrations, no unit tests/TDD and
no source PR merges/auto-merge are unchanged.

The coordinator serializes `codex/auth-003-review-*` checkpoints in the same
015e worktree. Private source is preserved on `codex/auth-003-nest-boundaries`;
no force push or source-history discard is authorized. Allowed coordinator paths
include API platform/composition and the documented feature layers, root review/
lint/manifest metadata, the assigned API/mobile source, focused E2E suites and
current-state documentation. No additional product or provider work is inferred.

The [execution amendment](../plans/2026-10-29-authentication-review-decomposition.md)
records dependencies and review order. The
[verified integration reference](../verification/2026-10-29-authentication-review-stack.md)
records source checks separately from each checkpoint's local evidence. This
first checkpoint contains architecture/policy only; source arrives in subsequent
PRs. Every PR stays open for owner review; the final PR map will be recorded here.
