# Authentication execution evidence

Date: 28 October 2026. Packet:
[AUTH-003](../tasks/AUTH-003-authentication-implementation.md).
Plan: [authentication implementation](../plans/2026-10-28-authentication-implementation.md).
This record covers assignment and ongoing implementation. Initial preflight
sections describe the earlier state; the latest checkpoint below records current
source, actual checks and remaining acceptance.

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

## 29 October integrated source checkpoint

PR #25 is merged at `fbe808edcf8c8ce18b2083b0fab5c5af8ee7eac6` under explicit
owner authorization. Implementation branch `codex/auth-003-official-auth` and
[draft PR #26](https://github.com/GloupsApp/gloups-health/pull/26) remain open and
unmerged; no auto-merge is enabled. Tasks 1–6 source is implemented in this
checkpoint; complete behavioral acceptance and owner integration remain pending.

The Expo client uses official Better Auth/Expo, Router, SecureStore, native Apple,
Localization, UI and development-client integrations. Canonical base/theme tokens
were imported before flow source. Credential, social, method and deletion routes
share one retired-generation storage/request boundary. Only a validated session
and `/api/me` produce authenticated account state. Source contains no community
NestJS wrapper, native Google plugin, health domain or provider registration.

### Actual HTTP and database evidence

`GLOUPS_AUTH003_FAULTS=1 bunx e2e run --target api`, run
`01a1853d-dc2c-7aec-8be6-a0d94528d3ff`: **26/26 passed in 14.77 seconds**.
The service was rebuilt successfully and restarted before this run. In addition
to the earlier actual 22 cases, it verifies expired signed verification proofs
independently of ledger expiry, concurrent verification/reset single-use behavior,
no-store on authenticated/denied/SDK responses, and a transparent loopback relay
forwarding real cookies/account data, holding/releasing a response, cutting a
connection and recovering. No provider success or native race pass is inferred.

The protected guard and official-response forwarding now set `Cache-Control:
no-store`. The native client retains portable RequestInit options; an unsupported
web cache option was removed without adding a shim or weakening type checks.
See [API cases](../../e2e/api/authentication.md) and
[native cases](../../e2e/mobile/authentication.md) for exact coverage and omissions.

### Native evidence and manual prerequisite

Regular iPhone Expo Go public-screen/language run
`01a1850e-0827-746b-813b-fc7c5372031c` passed 1/1 in 16.36 seconds at that
earlier source checkpoint. Current credential/social/device acceptance remains
incomplete. iOS and Android native debug/development-client builds succeeded,
with build warnings retained privately. Exports/builds are not native journeys.

The owned iPhone 17 uses iOS 27.0; the owned Duo uses iOS 27.1; Android uses an
owned Pixel 8 profile/Android 37 Google Play 16K arm64 AVD. The case record names
exact IDs. Published Expo Go asset hashes were verified before install.

Native attempts encountered repeated system Open-in-app prompts, a Duo hinge
read without a sample, Android first-run/process-close errors and later iOS
launch/cleanup timeouts. Computer-use inventory then explicitly reported the Mac
locked and automatic unlock unsuccessful. Manual unlock is requested; no lock
bypass or successful credential journey is claimed. Only the dedicated task
driver was reset; the global driver and unrelated devices remain untouched.
Owned idle Duo/Android devices were shut down to release resources.

Live Google/Apple credentials, an authorized HTTPS callback environment, physical
iPhone credential-state evidence, actual email delivery and release retention/
audit/backup/re-registration decisions are still missing. Release startup remains
blocked. No deployment, cloud build, paid resource or distribution occurred.

### Static checks

- `bun install --frozen-lockfile`: 1,501 installs checked, no dependency changes.
- `bun run build`: 6/6 tasks successful, five cache hits; current mobile iOS/Android
  export executed. Root compiler ran; API cache-control compilation ran uncached
  before HTTP acceptance.
- SDK-aware Expo dependency check: up to date at Expo 58.0.21 / system-ui 58.0.7,
  React Native 0.88.0 / React 19.3.0 and exact compatible module pins.
- `bunx ultracite fix`, `bunx ultracite check`: passed after spacing correction.
  `bunx ultracite doctor`: eight passed, zero warnings/failures.
- Graph dry-run contains API/docs/mobile build and typecheck, six tasks.
  Changesets status reports the existing documentation patch only.
- Inner domain/application imports remain framework/SDK/ORM-free. Generated
  migration history remains reviewed/ordered; native output, private environment,
  databases, reports and signing material remain ignored.

Git diff/link/scope checks and the one fresh whole-branch source review are
recorded after publication. No GitHub Actions/hosted CI evidence is claimed.

### Execution decisions and costs

The following decisions preserve the inline execution ledger in the committed
handoff. They do not mark missing acceptance complete.

- Apply the repository's no-unit-test/no-TDD policy instead of skill red/green defaults — explicit user repository instruction overrides skill examples — without required E2E evidence behavior remains unaccepted.
- Open PRs and leave them unmerged; do not enable auto-merge — latest direct user instruction supersedes automatic integration — completion/integration waits for owner review and merge.
- Keep TypeScript 6.0.3 despite registry latest 7.0.2 — approved shared baseline explicitly pins 6 for compiler API compatibility — upgrading requires a separate reviewed tooling change. Other API pins match latest stable metadata.
- Proceed with independent backend source/static work while Army and live-provider evidence remain pending — plan Task 0 permits this — no task or behavioral acceptance is marked complete without its required evidence.
- Drizzle config explicitly loads workspace .env.local when DATABASE_URL is absent — Bun filtered scripts did not load the workspace environment (observed generation error) — CLI must fail closed if no explicit URL/local file exists.
- Apply API-local skipLibCheck true and document removal condition in CODE-STANDARDS — owner explicitly approved 29 October after the 99-error diagnostic — authored checks/root config remain strict; dependency declaration regressions remain unchecked until upstream repair.
- Remove Mobbin prerequisite for auth/UI work — owner explicitly states Mobbin is not needed at all — platform and canonical-brand review still apply. E2E Army installation through Expo is authorized; inspect supported tooling before installation.
- Add server-only email/identity/subject fingerprints and native setup correlations through official schema options — atomic deletion guards and partial native-effect cleanup need these values in the actual SDK transaction — custom SQL integrity rules must be reviewed and exercised before acceptance.
- Use a separate two-connection proof-lock pool while the SDK uses its normal transaction pool — prevents deletion from racing issued reset/verification consumption without starving SDK connections — pool sizing needs load validation before release.
- Implement only an explicit synthetic local retention policy (24-hour retry/orphan fallback, 61-minute post-completion reservation, 24-hour completed-job expiry, 48-hour notification replay markers) while release startup remains blocked — accepted design intentionally defers live retention/audit/backup decisions — these durations are not live policy or compliance claims and require owner decision before real release.
- Commit Tasks 3/4 source as an integrated checkpoint — native setup guards and deletion reservations share official schema fields/migration contracts — a larger review diff is the cost; acceptance remains separately recorded and no task is marked complete.
- Add the official Localization/UI packages and a root-invoked workspace deps:install script — supported native locale ordering and native controls need actual consumers — extra dependency/runtime surfaces require Expo checks and device evidence.
- Use native React Native text fields for controlled drafts, autofill/paste and explicit accessibility labels; @expo/ui handles native actions/settings — SDK 58 universal input has observable state and no public accessibility-label prop — visual and assistive behavior must be checked on devices.
- Prefer the approved generation/account boundary over generic stale-content caching guidance — an offline account cannot retain an authenticated AccountView — users must reconnect to validate protected access.
- Add guarded POST /api/identity/password calling public auth.api.setPassword — stable SDK marks setPassword server-only, so the planned mobile SDK route does not exist — the new thin HTTP contract needs explicit E2E freshness/ownership/validation evidence.
- Serialize raw SDK unlink/password mutations with the existing identity proof lock — concurrent unlink count checks must preserve the last method — extra lock contention needs runtime/load validation.
- Treat native credential-state observations as grounds for current-session sign-out only — client observations are not verified Apple server evidence — global revocation relies on signed Apple notifications.
- Apply SDK58 patch updates required by the official installed Expo checker — baseline Expo58.0.20/system-ui58.0.6 are below its current compatible patches — retain SDK58 and record exact new pins rather than leaving the dependency gate failed.
- Allow explicit sign-in while already authenticated — fresh reauthentication/account switching cannot redirect away from its form — submit retires the old generation and revalidates the resulting account. Retirement is idempotent to prevent a delayed old revocation check clearing a newer generation's key index.
- Add SDK-compatible official expo-dev-client for custom-scheme native acceptance — Expo Go cannot establish the Gloups app identity/custom callback configuration; prompt behavior is not yet attributed and the Mac was later found locked — adds a development runtime/dependency surface that needs compatible builds and device evidence. No EAS/cloud/distribution is involved.
- Persist an explicit en/fr UI preference separately from credential ownership and carry it through bounded request headers/server OAuth context on social creation — language must survive relaunch without becoming identity authority or inferred country — extra local persistence and provider-language paths require their own real-device/provider coverage.
- A cold OAuth callback revalidates stored proof or requires restarting the flow; query cookies never establish identity — only the owned official browser exchange may import its result — a process-death interruption can require repeating sign-in.
- Reserve loopback 4342 for a private transparent HTTP fault relay in e2e/mobile/helpers — delayed real SDK/API responses and transport cuts need an observable real-boundary path without modifying product flows or substituting mocks — adds a local test process/configuration and requires explicit forwarding/reset evidence. Its upstream remains the real owned API 4340, payloads stay in memory, and no provider success is synthesized.
- Commit Tasks5/6 source as an integrated checkpoint — generation/storage, social and account lifecycle screens share one client/controller contract — the larger review diff is the cost; native/provider acceptance remains incomplete and no task is marked complete.

- Correct authentication current-state paragraphs in the coordinator-owned root README/ROADMAP/AGENTS and VERIFICATION/CONTRACTS guides — leaving empty-shell/API-reservation and pending-design-approval claims would contradict this implementation — expands documentation review scope only, without changing product authority or accepting a shared health contract.

### Final review decisions and costs

- Acquire every identity proof admission on the separate proof pool before opening the main transaction — deletion waiters must leave connections available to SDK proof holders and unrelated accounts — the two-connection admission queue still requires bounded-load and contention checks.
- Preserve commands authenticated before concurrent session revocation — the accepted contract allows those already authorized deletion commands to finish and share their receipt — a narrowly concurrent authenticated command can finish after revocation; later requests still fail authentication.
- Apply the existing synthetic 24-hour orphan bound only after attempting to bind a valid active owner — failed orphan revocation persists attempts/backoff, tagged sessions are removed, and expired unowned material is purged with the initial manual-removal guidance — unrecoverable Apple authorization can require manual removal; no production retention policy is approved.
- Return expired/replayed verification errors only to an independently trusted approved callback, with a fixed error and all incoming query data removed — emailed native links need a recoverable localized screen while tokens/cookies and untrusted origins must never become identity — native screen acceptance remains pending the host unlock.
- Live Google/Apple success, signed notifications and actual Apple revocation remain unaccepted — the reviewer had no configured credentials or authorized HTTPS callback evidence — shipping before those gates would expose unproven provider paths.
- Full regular iPhone/Duo/Android, accessibility and delayed-storage acceptance remains open — locked-host launch failures and compilation are not device evidence — source review cannot establish native runtime usability.
- Physical iPhone Apple credential-state acceptance remains required — no assigned physical-device evidence exists — client revocation observations remain unverified on actual hardware.
- Live sender and production retention/audit/backup are release prerequisites — only explicit local synthetic policy exists; the orphan retry defect is fixed within that policy — live release remains blocked until owner decisions and real sender evidence.
- Do not deploy, distribute, register providers or migrate source data — those actions are outside AUTH-003 authorization — acceptance still needs an authorized live environment.
- Keep health domains, operator tooling and alternate sign-in methods outside this packet — no approved implementation scope covers them — these product capabilities remain absent.
- Honor the owner Mobbin waiver and API-only declaration exception — the reviewer correctly treated these as approved exceptions; authored code and root strict checks remain — upstream dependency declarations are not fully checked in the API project.
- Retain cold OAuth restart and query-cookie non-authority — only an owned official browser exchange can import credentials; a cold callback revalidates stored proof — process death can require repeating social sign-in.

## Whole-branch review and fix pass

Source checkpoints published to draft [PR #26](https://github.com/GloupsApp/gloups-health/pull/26):
`f698a8d5b4a6dcfcebbcad0488def163b118a4f3`,
`aa1e4e0cc90d9118652177785dbb9f5d7b4d0f36`,
`1d5b6d055bef3ec9046e242a204b4f2c429fd250`.
One fresh independent reviewer assessed `fbe808e..1d5b6d0`, the approved plan/spec,
implementation and acceptance gaps. Four Important findings were accepted in one
coordinated fix pass; no Critical or Minor findings were raised. No second review
was dispatched. Repository no-unit-test/no-TDD instructions take precedence over
the skill's red/green examples.

1. Native callbacks: the installed Expo SDK emits the triple-slash custom-scheme
   form. Correct route normalization accepts it while independently checking the
   official trusted-origin policy, exact routes and URL credentials/fragments.
2. Proof admission: deletion and worker identity removal acquire the same
   separate-pool advisory lock before opening a main-pool transaction. The five
   second lock wait is bounded. Already authenticated commands retain the agreed
   concurrent-revocation policy.
3. Orphan credentials: reviewed/generated migration 0005 adds retry attempts.
   Failed revocation commits tagged-session removal with exponential backoff;
   active owners bind before the synthetic 24-hour unowned-material fallback.
   Ordinary expiry cleanup runs independently of job/reconciliation failure.
4. Verification recovery: expired, replayed and old-user proofs redirect only to
   independently trusted approved callbacks with a fixed error/flow and all
   incoming query data removed. No callback retains JSON 400. The mobile callback
   offers the localized resend route; native rendering remains unaccepted.

Army run `01a18562-bd71-7301-92e4-afe51ee347b9`,
`GLOUPS_AUTH003_FAULTS=1 bunx e2e run --target api`: **29/29 passed in 21.12s**
after successful uncached API compilation and restart. The sixteen-deletion/reset
case proves unrelated-account progress while exceeding the main-pool capacity.
The orphan case proves durable retry/expiry and independent routine cleanup,
using deliberately unusable synthetic material; it does not prove live Apple
HTTP 5xx or revocation. Exact cases/limits are in the
[API record](../../e2e/api/authentication.md).

The first focused run passed 4/5 and found a test expectation mismatch: the
SDK rejects untrusted POST callbacks with 403 before the application hook. The
corrected native-URL case passed 1/1, followed by the full 29/29 suite. These are
real post-implementation E2E checks, not a claimed red/green sequence. All four
source findings have focused HTTP/Postgres evidence; full native/provider,
physical-device, sender and release-policy acceptance remains open.

### Final local checks and resource handoff

The review source passed uncached API build/typecheck in 2.75s, root tooling and
API/mobile compiler checks, then the 29-case suite above. The root build passed
6/6 with 4 cache hits in 7.338s; iOS/Android exports executed for the callback UI.
The final unchanged-source root build passed 6/6 with 6 cache hits (root TypeScript
still executed). Cached tasks are not additional runtime evidence. Ultracite
fix/check passed 207 files; doctor 8/8, zero warnings/failures. Graph dry-run
contains the six API/docs/mobile build/typecheck tasks; Changesets still reports
only the existing docs patch. Frozen install and SDK dependency checks from the
integrated checkpoint remain valid: this fix pass adds no dependencies.

Actual diff verification checked 21 changed Markdown files, 141 local links and 5
anchors; domain/application imports stay inward. No generated native output,
private environment/state, unit tests or new workflow entered the branch.
The owner Mobbin/declaration exceptions remain scoped as recorded above.

After capturing evidence, the coordinator stopped only cwd-verified AUTH-003
listeners 4340/API,4341/sink, 4342/fault relay and 8085/Metro. The owned driver daemon
was identified by its plan-local stdout log and stopped. Both owned iOS simulators
are Shutdown; the owned Android emulator had already stopped. PostgreSQL's owned
Compose container exited 0; its volume `gloups-auth-auth003_postgres` is preserved.
A subsequent port inventory found no listener on 4340/4341/4342/8085/25440.
Ignored mode 0600 environments, reports, local debug builds, simulator data and
worktree are preserved. OrbStack and unrelated devices/processes remain untouched.

Resume with the documented local Compose/API/sink commands and the owned native
launcher on port 8085; the optional fault relay additionally needs its private
ignored configuration. The Mac must be manually unlocked before native UI work.
Provider configuration locations/HTTPS callbacks and an assigned physical iPhone
remain requested. No deployment/distribution/provider registration occurred.
PR #26 remains draft/open; its mergeability is MERGEABLE and autoMergeRequest is
null. Only PR #25 was authorized and merged. No Task 0–7 completion or release
readiness is claimed.
