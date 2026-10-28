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

path = Path('apps/api/.env.local')
if path.exists():
    raise SystemExit('Existing local configuration preserved.')
password = secrets.token_urlsafe(32)
lines = [
    'APP_ENV=local',
    'API_HOST=127.0.0.1',
    'API_PORT=4340',
    'BETTER_AUTH_URL=http://127.0.0.1:4340',
    'AUTH_TRUSTED_ORIGINS=http://127.0.0.1:4340,gloups-health://auth/callback',
    'BETTER_AUTH_SECRET=' + secrets.token_urlsafe(48),
    'POSTGRES_PASSWORD=' + password,
    'DATABASE_URL=postgres://gloups_auth003:' + password + '@127.0.0.1:25440/gloups_auth003',
    'EMAIL_SINK_URL=http://127.0.0.1:4341',
    'EMAIL_SINK_SECRET=' + secrets.token_urlsafe(48),
]
with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w') as file:
    file.write('\n'.join(lines) + '\n')
PY

bun install --frozen-lockfile
docker compose -p gloups-auth-auth003 --env-file apps/api/.env.local -f apps/api/compose.local.yaml up -d postgres
bun run api:db:migrate
bun run api:build
```

The lane owns API 4340, Postgres 25440, sink 4341 and future Metro 8085. The database
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
  Fastify IP, with local proxy trust disabled. SDK `X-Retry-After` is preserved
  and also exposed as standard `Retry-After`.

Google, Apple, native exchange, deletion and mobile journeys follow later plan
tasks; their complete acceptance is not established by this initial API slice.
Release startup, real providers/email, retention policy and physical Apple device
acceptance remain separate prerequisites. Deployment/distribution is unassigned.

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
