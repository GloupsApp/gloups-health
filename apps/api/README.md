# API platform checkpoint

This review slice provides NestJS 12 with the official Fastify adapter, validated
namespaced ConfigModule settings and named main/proof DrizzleModule databases
using postgres.js. Domain/application and auth routes arrive in dependent PRs.

Use the pinned Bun version from the root. API scripts are `bun run api:build`,
`bun run api:start` and `bun run api:watch`. Start the isolated database with
`docker compose -p gloups-auth-auth003 --env-file apps/api/.env.local -f apps/api/compose.local.yaml up -d postgres`.
The local ignored mode 0600 environment follows `.env.example`; keep secrets out
of Git/output. The integration lane already owns its configuration and volume.

`bun run e2e:api` exercises real health/readiness and configured CORS on 4340.
No auth endpoint, provider connection, release or native acceptance is claimed
by this platform checkpoint. Config validation still rejects nonlocal release
settings; the approved subsequent slices own authentication behavior.
