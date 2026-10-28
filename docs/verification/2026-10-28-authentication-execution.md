# Authentication execution evidence

Date: 28 October 2026. Packet:
[AUTH-003](../tasks/AUTH-003-authentication-implementation.md).
Plan: [authentication implementation](../plans/2026-10-28-authentication-implementation.md).
This record starts with Task 0 preflight; no authentication source has been added.

## Assignment and authority

The owner selects native execution and requires PRs for review before merge.
D018 records that agents must not merge or enable auto-merge for this work.
The plan was delivered in PR #24/main revision
`c8be0f671c1cfe88c362dda78f9873f08b3859cc`.

Worktree: `/Users/maximebourmaud/.codex/worktrees/015e/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Assignment branch: `codex/auth-003-assignment`, based on that main revision.
The existing linked worktree was verified; no new worktree was created, no other
checkout changed and no server/device was taken from another lane.

AGENT-WORKFLOW step 2 and plan Task 0 require the execution assignment merged on
main before source work. The owner-review rule also covers that assignment PR.
The agent leaves it open for owner review/merge and does not infer a waiver from
the native-execution choice. No renewed design or stack approval is required.

## Preflight actually observed

- `git rev-parse --git-dir --git-common-dir`, worktree inventory and the empty
  superproject result establish this is the existing isolated checkout.
- Current Node: `26.12.1`; pinned Bun `1.4.4` is available through
  `/tmp/gloups-tooling-20261028/bun-1.4.4`. Planned Node `26.13.0` was not installed.
- Docker client: `29.9.2`. Server connection failed because the configured
  OrbStack socket was absent; `orb status` returned Stopped. No daemon, container
  or database was started or stopped.
- `lsof -nP` over TCP listeners `4340`, `25440`, `4341`, `8085` returned none.
  These remain proposed lane resources, not proof of a running/reserved service.
- Tool inventory and plugin search for E2E Army/Tester Army and Mobbin returned
  no matching plugin. Expo automation tools exist, but no simulator/device or
  native journey was used as substitute evidence. No paid cloud session started.
- The selected executing-plans helper created the plan-scoped ignored workspace
  and Task 0 brief, with base `c8be0f671c1cfe88c362dda78f9873f08b3859cc`.
  The ledger records interface dependencies, policy rulings and the pending main
  gate. No task completion line or product acceptance is claimed.

## Checks and limits

- Pinned Bun `1.4.4`: `bun install --frozen-lockfile` passed; 1,215 installs
  checked across 1,387 packages, no dependency changes.
- `bun run typecheck` passed for the root tooling and both existing workspaces;
  the docs/mobile Turbo tasks replayed their existing cache hits.
- `bunx ultracite fix` covered the nine owned Markdown files.
- `bunx ultracite check` passed across the existing workspace;
  `git diff --check` passed.
- `python3 /tmp/gloups-auth-execution-assignment-doccheck.py` passed: exactly
  nine owned Markdown files, 64 local targets and two anchors. Tasks 0–7 remain
  unchecked and the main-assignment, owner-review and no-TDD gates are preserved.
- Manual diff/status review found documentation only, no application scaffolding,
  excluded public references, credentials, health records or signing material.

No unit tests or TDD were used. No source/dependency/migration,
provider configuration, live email, deployment or distribution changed.
No API/PostgreSQL/E2E Army/native/provider acceptance has run. Missing tools and
provider/retention/device inputs remain the staged dependencies from the plan.

The repository's no-unit-test/no-TDD policy overrides the selected skill's
red/green examples. The latest owner PR-review requirement overrides earlier
automatic Git integration. Neither exception supplies main-assignment approval
or makes unperformed checks pass. Preserve the worktree and ignored user state
while awaiting the owner's review; resume Task 0/1 at the actual merged base.

## Review delivery

[PR #25](https://github.com/GloupsApp/gloups-health/pull/25), initial commit
[`7425b13155979ca9404a2ce4e8201ccd8488cc39`](https://github.com/GloupsApp/gloups-health/commit/7425b13155979ca9404a2ce4e8201ccd8488cc39),
is open and attached to this chat. Staged Ultracite and commitlint hooks passed.
No merge or auto-merge action was invoked. Main was fetched and still pointed to
`c8be0f671c1cfe88c362dda78f9873f08b3859cc` before this assignment push.

The owner was asked whether to review/merge the concrete assignment first or
explicitly permit isolated source work before it merges. That question changes
neither the approved authentication design nor the requirement to leave PRs for
owner review. No answer or waiver is assumed; source work has not begun.

## 29 October: authorized merge and native execution

The owner explicitly authorized merging PR #25 and starting native execution.
It merged at `fbe808edcf8c8ce18b2083b0fab5c5af8ee7eac6`; the assignment and
registry were read back from `origin/main` before source work. Execution branch:
`codex/auth-003-official-auth`. All subsequent PRs remain for owner review; this
one authorized merge is not permission to merge implementation PRs.

The approved stable API pins were rechecked against npm metadata. TypeScript's
latest tag is now `7.0.2`; the reviewed shared `6.0.3` compiler remains for the
existing compiler-API compatibility requirement. Node `26.13.0` Lithium LTS was
downloaded from the official Node distribution and its SHA-256 verified before
use. It lives only in task-specific `/tmp` tooling; the system Node is untouched.
OrbStack was started from Stopped; its Docker server is `29.8.2`. The four lane
ports were free. No existing AUTH-003 container or volume was found. Only the
lane's isolated Postgres/volume is being created, with ignored mode-0600 local
configuration; no secret values were printed.

### Declaration-checking prerequisite

`bun run api:build` fails at API typecheck. A direct repeat with
`bun run --filter @gloups/api typecheck` reports 99 dependency declaration errors:
three in Better Auth core, 22 in Better Call, 73 in Drizzle ORM and one in
thread-stream. They include missing optional `bun:sqlite`/Gel/MySQL types,
HTTP/Web Crypto ambient types, inconsistent published query-builder declarations,
and the removed Node `worker_threads.TransferListItem` type. There are no authored
API source diagnostics at this revision.

Diagnostic-only `bun run --filter @gloups/api typecheck --skipLibCheck true`
passes. The committed API config still inherits `skipLibCheck: false`. No dummy
ambient shims, unused database drivers or altered library declarations were
introduced. The proposed exception is API-local `skipLibCheck: true`, retaining
all strict checks on authored code, with this evidence and a removal condition in
CODE-STANDARDS. The owner must approve it because the existing docs/mobile
exceptions explicitly do not authorize another project to skip declarations.
Full diagnostic output is in this plan's ignored workspace; it contains no
credentials or health data. This is a compile diagnosis, not unit/E2E evidence.

### Owner rulings and first API evidence

The owner approved the API-only declaration exception on 29 October (D019),
removed Mobbin and authorized E2E Army installation for Expo testing. The local
runner is official `e2e` 0.21.3 with `@e2e-dev/mobile` 0.12.4; installed help and
upstream setup/writing guidance were read. No model login or paid cloud session
was used. CODE-STANDARDS now records the API exception and removal condition;
root declaration checking remains enabled.

Drizzle generated and applied two ordered migrations to the empty lane database.
Actual server: PostgreSQL 18.6; data directory `/var/lib/postgresql/18/docker`,
matching the image volume mount. The API and local sink run as emitted Node ESM
on 4340/4341. Schema regeneration after the explicit registry change reports no
schema changes. Root/API/docs/mobile typechecks passed with no cached workspace
tasks; Ultracite check passed and doctor reported 8 passed, 0 warnings/failures.

E2E run `01a184af-1d33-7bd9-b55e-b767c7f54977` passed all 12 initial API cases
in 4.90 seconds against actual HTTP/Postgres. See the
[case record](../../e2e/api/authentication.md) for exact coverage and remaining
journeys. Earlier failed runs revealed real signup callback transaction/ledger
visibility and Retry-After issues; the fixes flush the email handoff after SDK
commit and preserve/alias its rate-limit header. Formatter changes also exposed
Nest constructor metadata loss; explicit injection decorators preserve runtime
class tokens. No agent-written unit tests or TDD were used.

Final initial-slice checkpoint: run `01a184bd-041c-75df-963c-2a37201b87fc`
passed 12/12 in 5.12 seconds after restarting the API and sink with the final
boundary/parser/metadata fixes. Root build passed all six tasks (three cached);
API's final changed build/typecheck ran uncached. Changesets status passed and
reports the existing documentation patch only. Graph dry-run includes API, docs
and mobile. Migration reapplication is idempotent; isolated URL validation and
postgres.js migration pool max 1 are configured. No source PR has been merged.

### Social boundary and durable deletion checkpoint

Official provider configuration, private native proof, persisted Apple challenges,
prepared JOSE JWE handoff/reconciliation, explicit browser link proof and signed
Apple notifications are implemented. Existing provider IDs/credentials and an
authorized HTTPS/device environment are still required for live acceptance.

Generated migrations 0002/0003 were reviewed; custom 0004 adds provider-subject
uniqueness and transaction-level fingerprint/native-setup guards without editing
the generated SDK schema. The isolated database had zero users before applying
them. A separate two-connection pool holds issued-proof locks without consuming
all SDK connections. Deletion reserves/freezes/revokes atomically; the worker uses
leases, purges this slice and handles minimal Apple retry/manual state.

Army run `01a184de-e508-700d-8f49-61e9fec8a402` passed 19/19 in 10.13 seconds.
The expanded [case record](../../e2e/api/authentication.md) distinguishes actual
HTTP/SQL rollback, concurrency, restart and replacement-proof evidence from the
still-missing live provider scenarios. Root/API/docs/mobile typechecks passed.

Local-only retention fixtures are explicit in the API README: 24-hour fallback,
61-minute post-completion reservation, 24-hour job expiry, 48-hour notification
markers. They do not resolve live tombstone/audit/backup/re-registration policy;
release startup remains blocked. PR #26 remains draft/open with auto-merge off.

Final backend checkpoint run `01a184e0-7b76-7941-8b40-dbe22b51f59a` passed
20/20 in 11.38 seconds. API-04 restarted only this lane's PostgreSQL and Node
service, verified the same account UUID/session persisted, then confirmed
sign-out revocation. The replacement Node listener remains owned by this lane.
Root typecheck, API build, frozen install, graph dry-run, Ultracite and diff checks
passed. Live provider and mobile acceptance remain outstanding.
