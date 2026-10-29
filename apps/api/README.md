# Gloups authentication API

AUTH-003 adds a local NestJS service using its official Fastify adapter, Better
Auth 1.7.14, the official Expo/Drizzle integrations and PostgreSQL 18.6. Domain and
application code are plain TypeScript; Nest wiring, HTTP, SDK types and Drizzle
remain outside the core. No community NestJS authentication wrapper is used.

Node 26.13.0 is pinned in `.node-version`; Bun 1.4.4 manages the root workspace and
lockfile. Run commands below from the repository root with those versions on PATH.
The API's declaration-only exception is owner-approved in CODE-STANDARDS; authored
code retains the shared strict checks.

## Local setup

Create ignored local configuration without printing secrets. This preserves an
existing `.env.local` and creates a new file with mode 0600:

```sh
python3 - <<'PY'
from pathlib import Path
import os
import secrets
import json

path = Path('apps/api/.env.local')
if path.exists():
    raise SystemExit('Existing local configuration preserved.')
password = secrets.token_urlsafe(32)
lines = [
    'APP_ENV=local',
    'API_HOST=127.0.0.1',
    'API_PORT=4340',
    'BETTER_AUTH_URL=http://127.0.0.1:4340',
    'AUTH_TRUSTED_ORIGINS=http://127.0.0.1:4340,gloups-health://,exp://127.0.0.1:8085,exp://localhost:8085,exp://10.0.2.2:8085',
    'BETTER_AUTH_SECRET=' + secrets.token_urlsafe(48),
    'POSTGRES_PASSWORD=' + password,
    'DATABASE_URL=postgres://gloups_auth003:' + password + '@127.0.0.1:25440/gloups_auth003',
    'EMAIL_SINK_URL=http://127.0.0.1:4341',
    'EMAIL_SINK_SECRET=' + secrets.token_urlsafe(48),
    'IDENTITY_FINGERPRINT_SECRET=' + secrets.token_urlsafe(48),
    'AUTH_TOKEN_VAULT_KEYRING=' + json.dumps({'activeKid': 'local-v1', 'keys': {'local-v1': secrets.token_urlsafe(32)}}, separators=(',', ':')),
]
with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w') as file:
    file.write('\n'.join(lines) + '\n')
PY

bun install --frozen-lockfile
docker compose -p gloups-auth-auth003 --env-file apps/api/.env.local -f apps/api/compose.local.yaml up -d postgres
bun run api:db:migrate
bun run api:build
```

The lane owns API 4340, Postgres 25440, sink 4341 and Metro 8085. The database
is loopback-only and isolated in Compose project `gloups-auth-auth003`, with its
volume mounted at `/var/lib/postgresql`. Startup rejects a different database and
release mode while provider/email/retention decisions remain pending. No migration
runs at service startup.

Start the memory-only synthetic email sink and API in separate terminals:

```sh
bun run api:mail-sink
bun run api:start
```

The sink is loopback-only and accepts `.test` addresses. Its `/messages` read/clear
and `/control` failure switch require the ignored sink secret. It stores at most
100 messages in memory, including private one-time URLs; never log or publish its
payloads. No email is sent to a person or external service.

`bun run api:watch` rebuilds TypeScript; restart the Node service after rebuilding.
The server runs emitted Node ESM with decorator metadata, rather than Bun or
Node's TypeScript stripping. Constructors use explicit Nest injection tokens so
formatting/type-only imports cannot remove their runtime dependencies.

## Current HTTP boundary

- Public `GET /healthz`; official auth endpoints at `/api/auth/*`.
- Protected `GET /api/me` returns `{ account: { id }, user: { name, email,
  emailVerified } }`. A caller-supplied owner never selects account context.
- Protected `POST /api/identity/password` validates a 15–128 character new password
  and requires fresh verified identity. It calls public server-only
  `auth.api.setPassword`; the SDK does not expose this as a public auth route.
- Email/password requires verification, 15–128 characters and explicit sign-in.
  Verification/reset links last one hour; reset revokes existing sessions.
- Verification tokens use the public Better Auth token helper with issuing-user
  and unique-attempt claims, plus a hashed, atomically consumed issuance ledger.
- Signup's ledger/email handoff runs after its SDK transaction commits and before
  success is forwarded. Failed signup/resend handoffs return an unavailable
  response; reset retains its generic account-independent response and records a
  payload-free failure event.
- Sessions last seven days, refresh through the official session endpoint after
  24 hours, and require five-minute freshness for sensitive changes. Cookie cache
  is disabled. Application verification does not silently refresh a cookie.
- The scoped Fastify bridge preserves JSON/form bytes, redirects and individual
  Set-Cookie headers within 64 KiB. It uses the configured origin and verified
  Fastify IP, with local proxy trust disabled. Return routes are restricted to
  `/auth/callback` and `/reset-password` in addition to SDK trusted-origin checks.
  SDK `X-Retry-After` is preserved
  and also exposed as standard `Retry-After`.

## Social sign-in and deletion

Google uses browser OAuth; Apple uses the Service ID in browsers and the existing
native bundle ID for the server-side code exchange. Configure only inventoried
provider clients and the authorized HTTPS callback environment. Partial provider
configuration fails startup; no provider is enabled by the checked-in example.
Apple browser callbacks remain on the official handler. Direct provider ID tokens
are rejected unless the private native proof scope was established server-side.

`POST /api/identity/apple/challenges` issues a five-minute single-use nonce-hash
challenge. `POST /api/identity/apple/native` exchanges the code, validates the
native audience/nonce and invokes the official SDK. A prepared JWE credential
intent precedes SDK writes; cookies are forwarded only after binding the material
to the verified user/subject. A failed handoff returns unavailable, cleans tagged
sessions and leaves durable reconciliation work. Explicit browser links carry
server-controlled state bound to a still-fresh session. First-only Apple profile
fields are preserved by subject; a new identity without email needs an existing
sign-in method followed by explicit linking.

Apple notifications accept the documented JSON `payload`, verify the signature,
issuer, configured audiences and timestamps, and atomically deduplicate/revoke
sessions for consent-revoked/account-deleted events. They do not erase Gloups data.
Live provider success, native credential-state and notification delivery still
need the authorized provider/device environment.

`DELETE /api/account` requires a fresh verified session, explicit `confirm: true`
and a UUID `Idempotency-Key`. Its transaction reserves fingerprints, records the
job and revokes sessions. The 202 receipt distinguishes Gloups erasure from Apple
revocation. Already-authenticated same-key commands share the receipt; a later
revoked-cookie replay is 401. No unauthenticated status lookup is exposed.

Run `bun run api:worker` separately. The worker claims jobs with row locks and
expiring leases, purges this slice's records, and retries the official Apple
revocation endpoint with bounded backoff. The independent key ring must retain
old keys until pending credentials have been handled; credentials never go to the
app. API transactions and SDK writes share reviewed fingerprint guards; issued
proof/deletion operations also serialize on an identity lock in a separate pool. Unlink/password/session-revocation mutations share that
identity lock, preserving the last method under concurrent unlink commands.

Only synthetic local retention is implemented: a 24-hour retry/orphan fallback,
61-minute completed-identity reservation, 24-hour completed-job expiry and 48-hour
notification replay marker window. These are development fixtures, not an
accepted live retention/audit/backup policy. Release mode is rejected until that
policy, real email/provider configuration and required device evidence are ready.
Deployment/distribution remains unassigned.

## Schema and E2E verification

Schema-only auth options contain no runtime secrets. To regenerate after changing
those options, inspect the pinned CLI help, then run:

```sh
bun run api:auth:generate
bun run api:db:generate
```

Review/version the Drizzle SQL and metadata before applying it to the isolated
lane database. Never hand-edit the generated auth schema or use schema push as
migration delivery. Both auth and Gloups writes use Drizzle; the PostgreSQL driver
is confined to infrastructure.

With the API, sink and isolated Postgres running:

```sh
bun run e2e:api
```

This runs the official TesterArmy `e2e` CLI against actual HTTP/Postgres with no
model calls. Its cases reset only the lane's rate counters and synthetic
`auth003-…@example.test` records. Reports/traces stay in ignored `.e2e/`. There are
no unit tests or TDD. See [the case record](../../e2e/api/authentication.md) and
[execution evidence](../../docs/verification/2026-10-28-authentication-execution.md)
for actual coverage and limits.
