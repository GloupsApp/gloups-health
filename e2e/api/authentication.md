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

## Remaining acceptance

API-02's full browser provider/form callback and cookie-chunk evidence, database/API
restart and failure/rollback cases, old-proof delete/re-register races, browser and
native provider journeys, method linking, consent notifications and durable
account deletion remain pending their implementation. The mobile/device matrix
is independent. No complete authentication or release acceptance is claimed.

## Synthetic resource ownership

Only Compose project `gloups-auth-auth003` and its dedicated database are used.
Before/after hooks reset its short-lived counters and remove this suite's
`auth003-…@example.test` identities and mapping/issued proof records. The runner
rejects a different environment/database. Sink state is memory-only and cleared
between cases. Reports and private one-time state remain ignored, with no cloud
upload or feedback message.
