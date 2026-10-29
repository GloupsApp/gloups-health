# Authentication API acceptance

Runner: official TesterArmy `e2e` 0.21.3, installed in the root workspace.
Command: `bun run e2e:api`; config: `e2e.config.ts`, tools-only `api` target.
The service, synthetic email sink and isolated Compose Postgres must be running.
The cases are actual HTTP/database E2E, with no unit tests, TDD, model calls or
real-person email. Fixtures are generated in memory. Tokens, cookies and secrets
are never written into cases or evidence.

## Initial observed run

29 October 2026, run `01a184af-1d33-7bd9-b55e-b767c7f54977`: 12/12 passed,
4.90 seconds, Node 26.13.0, PostgreSQL 18.6, API 4340 / database 25440 / sink 4341.
The final initial-slice checkpoint, run `01a184bd-041c-75df-963c-2a37201b87fc`,
passed 12/12 in 5.12 seconds after boundary/style changes and service restart.

- API-01: real health/auth routes, anonymous denial, CORS, malformed and oversized
  auth bodies, and unsupported route behavior.
- API-03/04: two separate verified identities, 20 concurrent first protected
  requests yielding one mapping, Unicode/empty names, exact account wire shape,
  forged proof rejection and ignored caller owner parameters.
- MAIL-01/03: French verification content, canonical link origin, unverified sign-in
  rejection and one-time verification consumption; password lengths 14/15/128/129.
- MAIL-02/04: identical known/unknown recovery responses, one-time reset, existing
  session revocation and old/new password behavior through actual auth endpoints.
- MAIL-03: expired issuance-ledger rejection. This does not establish JWT clock
  expiry or the delete/re-register case from later lifecycle tasks.
- MAIL-04: controlled local sink failure, observable unavailable response and
  successful resend after recovery.
- API-03 / LIFE-01: IP-header spoofing cannot bypass the database signin budget;
  standard Retry-After, sign-out and next-request revocation apply.

## Social boundary and deletion checkpoint

29 October 2026, run `01a184de-e508-700d-8f49-61e9fec8a402`: 19/19 passed,
10.13 seconds, on the same Node/Postgres environment after service rebuild/restart.

- API-02 / SOCIAL-03: ordinary Nest JSON validation, disabled-provider handling,
  documented notification envelope validation and rejection of spoofed native
  proof headers/direct Apple or Google ID tokens.
- DEL-01/03: two sessions revoked at acceptance, concurrent same-key commands
  yield one job/receipt, revoked-cookie replay denied, no public status lookup,
  crashed lease blocks work until expiry, restarted worker erases auth/mapping/
  issuance state, local reservation blocks replacement, then a replacement gets
  a new account UUID and old reset/verification links fail.
- DEL-02: controlled SQL handoff failure rolls back freeze and revocation;
  missing Apple material takes the manual path. Deliberately unusable synthetic
  material plus unavailable provider configuration exercises durable retry,
  minimal remaining state and the explicit local fallback. This is not Apple
  HTTP 5xx, JOSE persistence, native exchange or live revocation evidence.

## Remaining acceptance

API-02's browser/form callbacks and cookie chunks, full token clock expiry/races, live Google/Apple OAuth, native nonce/code/
audience behavior, encrypted credential handoff failure, explicit method linking,
verified notifications and actual Apple 5xx/revocation/restart remain unaccepted.
The mobile/device matrix is independent. No complete authentication or release
acceptance is claimed.

## Synthetic resource ownership

Only Compose project `gloups-auth-auth003` and its dedicated database are used.
Before/after hooks reset its short-lived counters and remove this suite's
`auth003-…@example.test` identities and mapping/issued proof records. The runner
rejects a different environment/database. Sink state is memory-only and cleared
between cases. Reports and private one-time state remain ignored, with no cloud
upload or feedback message.

Final backend checkpoint run `01a184e0-7b76-7941-8b40-dbe22b51f59a` passed
20/20 in 11.38 seconds. API-04 restarted only this lane's PostgreSQL and Node
service, verified the same account UUID/session persisted, then confirmed
sign-out revocation. The replacement Node listener remains owned by this lane.
Root typecheck, API build, frozen install, graph dry-run, Ultracite and diff checks
passed. Live provider and mobile acceptance remain outstanding.

## Fresh password/concurrency checkpoint

Run `01a184fd-67ed-7ff1-982a-1655ba1f1aa0` passed 22/22 in 15.23 seconds
after a successful uncached build and restart. It adds actual HTTP/Postgres
freshness/ownership/length checks for the server-only password API bridge and
concurrent unlink commands that preserve a last method and reject another
owner's SDK account-row ID. Synthetic provider rows establish database/command
behavior only, not successful OAuth linking.

After bounded callback/language changes, run
`01a18525-174b-7cc8-a4ec-974b71834edf` passed 22/22 in 58.97 seconds while
local native compilation was running. Social language transfer still needs live
provider evidence. Earlier failed builds/runs are not new-source acceptance.

## Integrated 26-case checkpoint

Run `01a1853d-dc2c-7aec-8be6-a0d94528d3ff`, command
`GLOUPS_AUTH003_FAULTS=1 bunx e2e run --target api`: 26/26 passed in 14.77
seconds after a successful uncached API build/restart. MAIL-03 now verifies a
validly signed but expired local verification proof while its issuance ledger is
still live, followed by concurrent single-use consumption. MAIL-04 verifies two
concurrent resets produce one winner and invalidate prior sessions. API-04 checks
no-store on account, denied and official SDK responses.

RELAY-01 runs only with the owned relay available. It verifies actual upstream
sign-in cookies/account identity, hold/release, transport cut and recovery. The
default API script runs 25 ordinary cases and explicitly skips this opt-in case.
It is not native delayed-write or real-provider acceptance.
