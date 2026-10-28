# Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Repository policy overrides unit-test/TDD examples in either skill: use E2E Army against the real boundaries.

**Goal:** Implement French/English Google, Apple and email/password authentication
with a stable Gloups account, recovery, explicit linking and coordinated deletion.

**Architecture:** One NestJS service uses its official Fastify adapter, Better
Auth's official Fastify/Drizzle integration and PostgreSQL. The identity/access
context follows DDD/Onion: plain domain/application code, inner ports, outer
Drizzle/identity/email adapters and Nest composition. Expo SDK 58 uses the official
Expo client/SecureStore, native Apple on iOS and browser Google/Android Apple.

**Tech stack:** Bun 1.4.4 workspaces/Turborepo, strict TypeScript, Node ESM,
NestJS/Fastify, Better Auth, Drizzle/PostgreSQL and Expo SDK 58.

**Spec:** [Approved authentication design](../specs/2026-10-28-authentication-design.md),
approved by the owner on 28 October 2026 at revision
`0b55294aa375078fc43550d66647e220896e9eb0` (PR #22); D015–D017.
Planning owner: [AUTH-002](../tasks/AUTH-002-authentication-plan.md).

**Status:** Plan for review; no implementation step has run. The owner requested
planning, not execution. The file lists and bindings below are the proposed scope
for a later `AUTH-003` implementation packet. Before code, record its approval,
owner, branch/worktree, allowed paths and reservations on main and read it back.
Writing this plan does not configure providers, send email, deploy or distribute.

## Global constraints

- Official `@nestjs/platform-fastify`, Better Auth and Expo integrations only;
  no community NestJS auth wrapper or community Google React Native auth plugin.
- Keep domain/application free of NestJS, Fastify, Better Auth, Drizzle and driver
  imports. HTTP DTOs, SDK types, rows and transaction clients stay outside the core.
- Use Bun `1.4.4`, one root `bun.lock`, exact reviewed direct dependency pins and
  inherited strict authored-code checks. No automatic/purchased CI workflows.
- Keep Expo `58.0.20`, React Native `0.88.0` and React `19.3.0`; no product web app.
- Password length: 15–128 characters; verification/reset lifetime: 3,600 seconds.
- Database sessions: 604,800-second sliding expiry, 86,400-second refresh interval,
  300-second freshness for linking/destructive operations; server cookie cache off.
- Explicit linking only; preserve the Gloups UUID, support Apple relay addresses,
  and never merge independently created accounts merely because emails match.
- Revalidate before protected UI; clear local credentials on offline sign-out
  without claiming remote revocation. Discard responses from a retired session.
- Complete en/fr strings, accessibility and auth emails. Language is separate
  from locale, timezone, country, units and currency. Use UTC server instants.
- No health domains, real data in diagnostics, credentials in Git, source cutover,
  operator surface, deployment or distribution. Preserve user-owned local state.
- No agent-written/modified unit tests and no TDD. Behavioral acceptance uses
  E2E Army with real HTTP/PostgreSQL and regular iPhone, iPhone Duo and Android;
  physical-device evidence is required for Apple credential-state behavior.

## Review focus

1. JSON/form bodies and cookie chunks survive Fastify forwarding without changing
   the auth protocol; redirects use the configured origin. Cases API-01/02.
2. Concurrent bootstrap/link/delete or a retry after process death cannot create
   a second owner or revive a deleting identity. Cases API-04, LIFE-02/03, DEL-02.
3. An old email-verification/reset link cannot authorize a newly registered
   account after deletion, and replay is rejected. Cases MAIL-03/04, DEL-03.
4. Native Apple success includes durable encrypted revocation material; invalid
   nonce/audience, replay and partial persistence fail safely. Cases SOCIAL-03/04.
5. A delayed response, foreground/relaunch or failed offline sign-out cannot
   restore the previous account or credentials. Cases MOBILE-03/04/05.

## Targets, scripts and execution gates

These are implementation choices for review, verified against public metadata
on 28 October 2026; they are not newly installed packages. If a pin changes before
execution, review compatibility and update the packet/plan before installation.

| Target         | Exact pin / choice                                                                                                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API runtime    | Node `26.13.0` LTS; pin `apps/api/.node-version`; API `engines.node` is `~26.13.0`; do not change the root minimum solely for this package                                                                                                                  |
| NestJS         | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify` `12.3.2`                                                                                                                                                                                       |
| Fastify        | `fastify` `5.12.7`, `@fastify/cors` `11.3.1`                                                                                                                                                                                                                |
| Auth           | `better-auth`, `@better-auth/expo`, `@better-auth/drizzle-adapter`, CLI `auth` `1.7.14`; declare required adapter peers at `@better-auth/core` `1.7.14` / `@better-auth/utils` `0.5.1` if the reviewed workspace peer graph requires direct declarations    |
| Persistence    | `drizzle-orm` `0.45.4`, `drizzle-kit` `0.31.11`, driver `postgres` `3.4.9` through `drizzle-orm/postgres-js`; connection pool max 10, migrations max 1                                                                                                      |
| PostgreSQL     | Official `postgres:18.6-bookworm@sha256:5c4783a8cc3f0074912164f94dfa1be4e043438f0f707cf968d7af9a0d31a2c8`; named isolated volume mounted at `/var/lib/postgresql`, verify the image's PostgreSQL-18 data-directory layout before starting                   |
| API support    | `reflect-metadata` `0.2.2`, `rxjs` `7.8.2`, `jose` `6.2.13`; API dev types `@types/node` `26.6.6`, TypeScript `6.0.3`                                                                                                                                       |
| Mobile auth    | `better-auth`, `@better-auth/expo` `1.7.14`                                                                                                                                                                                                                 |
| SDK 58 modules | `expo-router` `58.0.28`, `expo-apple-authentication` `58.0.2`, `expo-crypto` `58.0.7`, `expo-secure-store` `58.0.2`, `expo-network` `58.0.4`, `expo-linking` `58.0.15`, `expo-web-browser` `58.0.7`, `expo-constants` `58.0.14`, `expo-status-bar` `58.0.4` |
| Router peers   | `@expo/metro-runtime` `58.0.15`, `@expo/log-box` `58.0.13`, `react-native-screens` `4.30.1`, `react-native-safe-area-context` `5.10.1`; omit optional web/native-toolbar/animation peers that the implementation does not use                               |

Node `26.13.0` became LTS on the planning date; the planning host was still
`26.12.1`, so no target-runtime/API compatibility is claimed. Expo pins must also
pass the installed SDK's check before commit; notably safe-area-context stays
within SDK 58's `~5.10.1` range rather than adopting the newer minor indiscriminately.

Existing root commands remain available now. The following commands are **future
scripts introduced by Task 1/5**, not commands to run while reviewing this plan:

| Root command                                 | Definition / result after implementation                                                                                                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run api:build`                          | `turbo run build --filter=@gloups/api`; API package runs `tsc --project tsconfig.build.json`                                                                                                                                                               |
| `bun run api:start`                          | `bun run --filter @gloups/api start`; API runs `node --env-file=.env.local dist/main.js`                                                                                                                                                                   |
| `bun run api:watch`                          | `bun run --filter @gloups/api watch`; `tsc --project tsconfig.build.json --watch`; rebuild alongside the server, no TypeScript decorator stripping at runtime                                                                                              |
| `bun run api:mail-sink`                      | API workspace runs `node --env-file=.env.local dist/local-only/email-sink.js`                                                                                                                                                                              |
| `bun run api:worker`                         | API workspace runs `node --env-file=.env.local dist/deletion-worker.js`                                                                                                                                                                                    |
| `bun run api:auth:generate`                  | Pinned `auth generate --config ./src/modules/identity-access/infrastructure/auth/auth-schema.config.ts --adapter drizzle --dialect postgresql --output ./src/modules/identity-access/infrastructure/persistence/auth-schema.ts --yes` in the API workspace |
| `bun run api:db:generate` / `api:db:migrate` | Pinned `drizzle-kit generate --config drizzle.config.ts` / `drizzle-kit migrate --config drizzle.config.ts` in the API workspace                                                                                                                           |
| `bun run mobile:dev`                         | Existing wrapper; Task 5 reserves Metro `8085` in its package script for this execution lane                                                                                                                                                               |

Read installed help before committing these scripts. Root one-off database,
worker and sink wrappers use Bun's workspace filter; build/typecheck use the
existing Turborepo graph. No migration, live API call or email task is cacheable.
Keep secrets out of Turbo outputs and load ignored environment files in the
workspace; no environment-file content belongs in task hashes or evidence.

### Task 0: Establish execution ownership and prerequisites

**Files:** the future `docs/tasks/AUTH-003-authentication-implementation.md`, registry,
`docs/SERVICES.md`, `docs/DESIGN.md`, and a dated implementation verification record.
Those prospective documentation updates must be included in the execution packet.

**Interfaces:** consumes this plan/approved spec; produces the reviewed execution
packet, environment inventory and resource/acceptance ownership for Tasks 1–7.

- [ ] Record the implementation packet's owner and exact file scope from the
      tasks below on main. Recommend one sequential worker because auth config,
      migrations and session lifecycle share interfaces. Do not start code from
      a planning assignment or assume another worker's ports/devices are free.
- [ ] Reserve proposed local API `4340`, PostgreSQL `25440`, email sink `4341`
      and Metro `8085`; check occupancy before starting. If occupied, coordinate
      replacement values in the packet and environment; never stop another lane.
      Use proposed unique Compose project/volume `gloups-auth-auth003` and synthetic data.
- [ ] Establish Node/PostgreSQL/Docker availability and the E2E Army connection.
      No Army or Mobbin tool/plugin was found during planning. Read the connected
      Army runner's supported interface before executing cases; do not invent an
      `e2e` command or substitute unit tests. Static work may proceed within an
      approved packet, but its behavioral acceptance remains pending.
- [ ] Before Task 5 screen/flow source, inspect actual Mobbin screens for sign-in,
      registration, recovery, account linking/deletion and callback states; record
      neutral selected links in DESIGN. Verify source palette/asset ownership and
      import the canonical colors once. No reference or palette was inspected here.
- [ ] Before live Task 3/6 acceptance, inventory authorized Google OAuth web client,
      Apple App ID/bundle ID, Service ID, signing key/capability, relay sender and
      HTTPS callback environment. Confirm actual native identifiers before config;
      never register replacements by assumption. Obtain authorized test accounts,
      email sender/recipients and relevant device ownership. Local sinks prove
      protocol behavior only; no message to a person or deployment is authorized.
- [ ] Before real-data/deletion release acceptance, record the owner-reviewed
      retention/re-registration policy: pending-revocation retry/expiry, tombstone,
      audit and backup durations, fallback on missing credentials and eligibility
      for a new account. This is an explicit release prerequisite from the spec,
      not permission to invent legal retention periods. Local synthetic runs use
      disposable state and remove only their own volume at accepted cleanup.
- [ ] Commit the packet/inventory with `docs: assign authentication implementation`.
      Read its merged revision before executing Task 1. Record prerequisites still
      pending and continue independent approved work; do not mark their journeys Done.

### Task 1: Run the Fastify service against migrated PostgreSQL

**Files:** create `apps/api/{package.json,.node-version,tsconfig.json,tsconfig.build.json,
drizzle.config.ts,compose.local.yaml,.env.example,README.md}` and
`apps/api/src/{main.ts,app.module.ts,config.ts}`. Within
`apps/api/src/modules/identity-access/`, create `identity-access.module.ts`,
`infrastructure/auth/{auth.ts,auth-options.ts,auth-schema.config.ts}`,
`infrastructure/persistence/{database.ts,auth-schema.ts,schema.ts,rate-limit.ts,rate-limit-schema.ts}` and
`presentation/{auth-http.plugin.ts,health.controller.ts,http-errors.ts,http-rate-limit.ts}`.
Generate migrations under `apps/api/drizzle/`; modify root `package.json`,
`bun.lock` and `turbo.json` only for declared scripts/tasks/dependencies.

**Interfaces:** `createDatabase(config: ApiConfig): { db, close(): Promise<void> }`
and `createAuth({ db, config }): Auth` are infrastructure-only; `Auth` is the
local inferred return type of `betterAuth`, not a shared/core export. Presentation exports
`registerAuthHttp(instance: FastifyInstance, auth: Auth, config): Promise<void>`;
no SDK/Fastify type crosses into domain/application. Public `GET /healthz` returns
`{ status: "ok" }`; application controllers use the `/api` prefix, raw auth routes
are registered once at `/api/auth/*`.

- [ ] Add the private `@gloups/api` workspace and exact reviewed dependencies above.
      Extend the shared TS base, keep `skipLibCheck: false`, set NodeNext
      module/resolution, Node types and legacy decorator/metadata settings only
      in API configs. Build config emits `dist`, disables inherited no-emit and
      importing-TS-extension settings; authored ESM imports use `.js` specifiers.
- [ ] Implement validated environment loading and ignored `.env.local` setup.
      Require URL/secret/database and environment-specific origin configuration;
      local mode can omit disabled social providers, release cannot silently omit
      required credentials/email/deletion policy. Generate local secrets without
      printing or committing them. Bind local mobile access deliberately.
- [ ] Create isolated Compose PostgreSQL with the pinned image, health check,
      lane volume and loopback-published `25440`. After Task 0 reservation, run
      `docker compose -p gloups-auth-auth003 --env-file apps/api/.env.local -f apps/api/compose.local.yaml up -d postgres`
      from the root. Create no production connection.
      Add shutdown hooks to close the postgres.js pool; do not migrate on startup.
- [ ] Factor static auth schema options from runtime secrets. Configure the
      official Drizzle adapter with explicit schema/model mappings and
      `transaction: true`; retain Better Auth's auth records and database rate
      limiter. Generate the auth schema with the pinned CLI, then Drizzle SQL.
      Never hand-edit generated auth schema, use direct-adapter migration, or use
      schema push as delivery. Review every generated relation/default/index.
- [ ] Implement the scoped Fastify bridge: buffer at most 65,536 bytes only in
      the auth scope, preserve original body/content type (JSON and form POST),
      path/query and method; derive URL from configured origin. Forward response
      status/body/location and separate `Set-Cookie` values. Keep ordinary Nest
      parsing intact and register explicit CORS before auth routes.
- [ ] Override any incoming internal IP header with Fastify's verified client IP;
      configure Better Auth to use only that header. Local proxy trust is off;
      release trust is an explicit inventoried proxy allowlist. No raw credentials,
      bodies, email URLs or cookies in request/error logs.
- [ ] Add the planned root scripts. From the root, run frozen install after the
      reviewed manifest/lock update, inspect `bun run turbo run build --dry=json`,
      generate/apply migrations to the empty lane database, then `api:build` and
      `api:start`. Do not start the server under Bun or Node's TS stripping.
- [ ] Run E2E Army case **API-01**: `/healthz` and `/api/auth/ok` return 200;
      ordinary Nest JSON and preflight work, unsupported routes/invalid auth
      input fail safely and oversized bodies return 413. Restart PostgreSQL/API
      and recheck schema availability. Full cookie/redirect/form proof is **API-02**
      in Tasks 2/3, once actual credential/provider journeys exist; a transport
      fixture alone does not establish a working provider connection.
- [ ] Run relevant Ultracite fix/check/doctor (setup changed), strict typechecks,
      root build and Changesets status. Commit `feat: add Fastify authentication service`.
      This task proves service/migration/transport, not completed authentication.

### Task 2: Enforce account ownership and email/password lifecycle

**Files:** under the identity/access context create `domain/{gloups-account.ts,
account-repository.ts}`; `application/{types.ts,ports.ts,resolve-account.ts,
authorize-sensitive-change.ts}`; `infrastructure/persistence/{account-schema.ts,
account-repository.ts,account-unit-of-work.ts,verification-ledger.ts}`;
`infrastructure/auth/{session-adapter.ts,lifecycle-hooks.ts}`;
`infrastructure/email/{email-transport.ts,local-http-transport.ts,templates.ts}`;
`presentation/{session.guard.ts,me.controller.ts,public-route.ts}`.
Create `apps/api/src/local-only/email-sink.ts`, extend auth options/schema/module
wiring and append generated SQL migrations. Record Army cases under
`e2e/api/authentication.md` with synthetic identities and expected results only.

**Interfaces:** all inner types below are plain TS, with no SDK/HTTP/ORM imports:

```ts
type VerifiedIdentity = {
  authUserId: string;
  sessionId: string;
  authenticatedAtMs: number;
  email: string;
  emailVerified: boolean;
  name: string;
};
type AccountView = {
  account: { id: string };
  user: { name: string; email: string; emailVerified: boolean };
};
interface AccountRepository {
  findByIdentity(authUserId: string): Promise<GloupsAccount | null>;
  insert(account: GloupsAccount): Promise<void>;
  markDeleting(accountId: string, deletionId: string): Promise<void>;
}
interface AccountUnitOfWork {
  run<T>(
    work: (scope: { accounts: AccountRepository }) => Promise<T>
  ): Promise<T>;
}
interface IdentitySessions {
  verify(proof: string): Promise<VerifiedIdentity | null>;
  revokeAll(authUserId: string): Promise<void>;
}
```

`ResolveAccount.execute(identity: VerifiedIdentity): Promise<AccountView>` owns
verified-email checks, UUID allocation, lifecycle state and unique-map retries.
Inject `nowMs(): number` and `nextAccountId(): string` functions through composition.
`AuthorizeSensitiveChange.execute(identity): Promise<void>` requires an active
account and server session creation within 300 seconds. An outer session adapter
verifies the credential and produces `VerifiedIdentity`; it does not accept a
caller-provided principal. Extend UoW with deletion-job operations only in Task 4.
`EmailTransport.deliver({ recipient, language, kind, url }): Promise<{ accepted:
boolean; receiptId: string | null }>` is the plain email port; language is `en|fr`
and kind is `verify-email|reset-password`; recipient and URL are strings. Concrete
transport responses stay outer.

- [ ] Implement the immutable domain account/lifecycle invariants. Add the unique
      auth-user mapping and idempotent insert/re-read transaction using Drizzle.
      Use a conflict-safe insert targeted at `authUserId`, rather than attempting
      to query inside a PostgreSQL transaction aborted by a unique violation.
      A duplicate concurrent first request returns the existing UUID; deleting
      bindings never bootstrap again. Database failure grants no access.
- [ ] Bind ports with Nest tokens/factories in `identity-access.module.ts`.
      Thin controllers/guard invoke use cases; request IDs, HTTP DTO validation
      and error mapping stay in presentation. `GET /api/me` returns only
      `AccountView`. Use app errors `{ error: { code, requestId, retryAfterSeconds? } }`:
      401 `AUTH_REQUIRED`; 403 `EMAIL_UNVERIFIED`, `FRESH_AUTH_REQUIRED` or
      `ACCOUNT_DELETING`; 409 `IDENTITY_CONFLICT`; 429 `RATE_LIMITED`;
      503 `SERVICE_UNAVAILABLE`; 400 `INVALID_REQUEST`. SDK routes retain SDK errors.
- [ ] Enable email/password with the approved lengths, verification requirement,
      sign-up auto-sign-in off, 3,600-second verification/reset expiry, session
      policy and no cookie cache. Keep email change and uncoordinated delete-user
      disabled. Use Better Auth hashing, reset and session APIs, not own passwords.
- [ ] Add validated `preferredLanguage` (`en`/`fr`, default `en`) to the auth-user
      schema and signup input for emails; no region inference. Deliver through
      an injected transport. Local sink is memory-only, loopback-only, synthetic
      and disabled outside local mode; never persist/log its secret URLs. Release
      requires the inventoried transport/sender and a receipt/failure path.
- [ ] Bind every issued verification URL to the issuing auth-user ID through a
      token-hash ledger with expiry and atomic consumption; check it in a supported
      Better Auth before hook. The upstream email-verification token is email-bound:
      do not assume deleting a user invalidates that JWT for a later same-email user.
      Clear these bindings on deletion; preserve SDK signature/expiry verification.
      Reset requests remain generic, tokens are single-use, and success revokes
      existing sessions before requiring sign-in again.
- [ ] Add database-backed limits: general auth 100/minute/IP, sign-in 5/minute,
      signup 3/minute, verification/reset sends 3/900 seconds, social/native starts
      10/minute. Custom HTTP routes use a Drizzle atomic counter store, not a
      process-memory-only limiter. Return Retry-After without logging identifiers.
- [ ] Run **API-02/03/04** and **MAIL-01/02/03/04** through actual HTTP and the local
      sink: two identities get different UUIDs, 20 concurrent `/api/me` requests
      get one mapping, no owner parameter changes context, bad/expired/revoked
      sessions fail, unverified users are denied, Unicode/empty display names work,
      password boundaries 14/15/128/129 behave as specified, verification/resend,
      expired/replayed links, unknown-email reset, reset revocation and email
      delivery failure/throttling work. Include actual cookie issuance/expiry plus
      controlled multi-cookie/chunk transport cases; prove transaction rollback
      on an interrupted account write. Test English/French without logging tokens.
- [ ] Restart the API/database and confirm mapping/session persistence and
      revocation on the next request. Review import/DI direction and run the
      relevant static gates. Commit `feat: add account and credential lifecycle`.

### Task 3: Implement browser OAuth and the native Apple exchange

**Files:** extend auth options/hooks; create `infrastructure/auth/{apple-native.ts,
apple-proof-context.ts,apple-notifications.ts,provider-credentials.ts,token-vault.ts}`,
`infrastructure/persistence/{apple-challenges.ts,provider-credentials-schema.ts}`,
`application/revoke-identity-sessions.ts`, and
`presentation/{apple-native.controller.ts,apple-notifications.controller.ts}`.
Generate migrations; update API env examples/readme and the API Army case record.

**Interfaces:** outer-only `completeNativeApple(input, requestHeaders): Promise<Response>`;
input `{ challengeId: string, code: string, nonce: string, profile?: { givenName:
string | null, familyName: string | null } }`. App-owned routes:
`POST /api/identity/apple/challenges` accepts `{ purpose: "sign-in" | "link",
nonceHash: string }`, returns `{ challengeId, expiresAt }`; purpose `link` requires
fresh actor proof. `POST /api/identity/apple/native` completes that stored purpose
and forwards the official SDK response/cookies. Challenge lifetime is 300 seconds;
hash is SHA-256 hex of the cryptographic client nonce. No client owner/subject is
trusted. Provider/HTTP types do not enter inner ports.
The notification endpoint is `POST /api/identity/apple/notifications`, accepting
Apple's documented signed payload; only the verified adapter may dispatch a
service-origin session-revocation command.

- [ ] Configure Google browser OAuth and Apple Service-ID browser OAuth with
      inventoried client IDs/callback URLs and minimal identity scopes. Explicitly
      allow the native bundle and Service ID as separate Apple audiences. Trust
      only the approved origins/return routes, including Apple's callback origin;
      no release wildcard Expo origins. Rotate Apple client-secret JWTs before expiry.
- [ ] Set explicit linking enabled, `disableImplicitLinking: true`, different-email
      linking allowed only after fresh authenticated proof, profile replacement
      on link off, and last-method unlinking prohibited. Before sensitive SDK
      endpoints, call the application freshness/account policy from official
      middleware hooks, including raw routes that bypass Nest's global guard.
- [ ] Implement single-use persisted Apple challenges. Exchange the native code
      server-side at Apple's token endpoint using the native client ID/client
      secret, then pass the exchanged ID token and original nonce to official
      `auth.api.signInSocial` (or `linkSocial` for a bound fresh actor), using
      `asResponse: true`. Verify through Better Auth; do not decode a client token
      and treat it as trusted. Reject invalid/missing nonce, audience, code or state.
- [ ] Restrict direct Apple ID-token sign-in/link calls to the verified server
      bridge. Use an infrastructure `AsyncLocalStorage` proof scope checked by
      official before hooks; a client-supplied header/body flag cannot grant it.
      Browser authorization-code callbacks remain on Better Auth's normal path.
- [ ] Before forwarding any successful native session cookie, durably store the
      exchanged refresh/revocation credential bound to the verified SDK user,
      Apple subject and client ID. The pinned direct-ID-token route does not
      persist a refresh token merely because one was included in its input.
      Use standard JOSE JWE encryption with a separate server key ring/kid; never
      return those credentials to the app. A failed write returns 503 without the
      new cookie and attempts revocation of the just-created session. Persist a
      reconcile job for partial link/sign-in effects; do not claim setup/link
      completion before that durable handoff. Exercise this failure explicitly.
- [ ] Implement verified/deduplicated Apple server notifications and native
      credential-state reporting. A consent revocation calls
      `RevokeIdentitySessions.execute(authUserId): Promise<void>`; it does not
      silently delete the Gloups account. Use official JOSE/Apple keys and validate
      signature, issuer, audience, timestamps and event identity; no custom signing.
- [ ] Complete **API-02**, **SOCIAL-01/02** and **LIFE-01/02/03**: actual browser Google on both
      platforms and Apple on Android, repeat identity, cancel/deny/interrupt,
      invalid state/return URL, same-email conflict, explicit different-email/relay
      linking, subject already owned elsewhere and last-method unlink rejection.
      Inspect real Apple form callback bytes, redirects and all issued cookies;
      the Fastify adapter must preserve them without JSON reserialization.
- [ ] Run **SOCIAL-03/04** using native Apple on an authorized iOS device:
      nonce/audience/code replay rejection, first-only/missing profile data,
      encrypted credential persistence, delayed/failing writes and cookie delivery.
      Use controlled provider failures alongside actual provider success. Record
      the exact HTTPS environment; no provider setup/deployment is implied.
- [ ] Run relevant checks and commit `feat: add official social authentication`.
      If provider access is missing, record incomplete acceptance rather than
      substituting a mock success or declaring the social slice Done.

### Task 4: Make deletion durable and retries safe

**Files:** create `application/{request-account-deletion.ts,process-account-deletion.ts}`,
`domain/deletion-job.ts`, `infrastructure/persistence/{deletion-schema.ts,
deletion-repository.ts,auth-records-repository.ts}`, `presentation/account.controller.ts`
and `apps/api/src/deletion-worker.ts`. Extend UoW, hooks/schema/module and generate
migrations; add deletion cases to the API Army record.

**Interfaces:** `RequestAccountDeletion.execute(actor, { idempotencyKey }):
Promise<DeletionReceipt>`; `ProcessAccountDeletion.execute(claim: ClaimedDeletionJob): Promise<void>`.
The UoW scope gains `deletions: DeletionRepository`; existing callers continue
using `scope.accounts`. The repository defines `enqueue(job): Promise<void>`,
`findByKey(accountId, key): Promise<DeletionJob | null>`, `claim(nowMs):
Promise<ClaimedDeletionJob | null>` and `save(claim): Promise<void>`, with string IDs/keys,
numeric UTC milliseconds and domain `DeletionJob` values. `ClaimedDeletionJob` is
`{ job: DeletionJob, leaseId: string, leaseUntilMs: number }`; save compares the
lease identity so a stale worker cannot overwrite a newer claim. External credentials
are opaque references. `IdentityRemoval.erase(authUserId: string): Promise<void>`
and `AppleRevocation.revoke(credentialRef: string): Promise<"revoked" |
"manual_required">` perform infrastructure effects. `DELETE /api/account`
requires a fresh session, `{ confirm: true }` and a UUID `Idempotency-Key`; returns
202 `{ deletionId, gloups: "deleted" | "pending", appleRevocation: "pending" |
"complete" | "manual_required" | "not_applicable" }`, with expired local cookies.
No unauthenticated UUID-only status lookup is introduced.

- [ ] In one transaction, verify active ownership/freshness, reserve the retry
      identity, mark deleting and persist the durable job/required revocation
      reference. Concurrent same-key requests return one receipt; different payload
      for a reused key returns 409. Freeze the binding immediately and revoke all
      sessions; all SDK mutation/session-creation hooks also reject deleting users.
      That receipt guarantee applies to requests already authenticated for the
      command. A later replay with a revoked credential returns 401; the durable
      job still finishes and no unauthenticated receipt lookup is permitted.
- [ ] Implement reviewed Drizzle purge queries over the generated auth schema and
      Gloups mapping/verification-ledger records. Do not call SDK private adapters
      or rely on the disabled public delete-user route. Cancel associated transient
      verification/recovery/link attempts, using the issuing-user correlations
      recorded at delivery/start. Delete Gloups personal data without waiting for
      Apple; keep only the protected job/credential/tombstone needed by the approved
      retention policy. No job foreign key may cascade away the pending revocation.
- [ ] Revoke Apple through the official endpoint; treat repeated revocation as
      idempotent. Poll/claim jobs with PostgreSQL row locking in the worker, use
      bounded backoff, and restart safely after interruption. On missing material,
      fulfill Gloups deletion and return manual Apple revocation guidance. Clear
      encrypted material after success; enforce the reviewed expiry/fallback policy.
- [ ] Block pending identity/email re-creation through lifecycle hooks using
      minimal keyed fingerprints, without retaining the whole user record.
      After completion, apply the recorded re-registration policy and allocate a
      new UUID where allowed; never transfer old ownership/history. Old verification
      or reset links must not authorize the replacement user.
- [ ] Run **DEL-01/02/03**: two sessions fail immediately after accepted deletion;
      auth/mapping/issued-token state is removed; Apple 5xx leaves only durable
      minimal retry state; crash after each handoff and concurrent retry produce
      one deletion; worker restart completes revocation; missing credentials follow
      the manual path; new registration cannot inherit an old UUID or token proof.
- [ ] Inspect actual remaining synthetic database rows/ciphertext and absence of
      sensitive logs. Run static checks and commit `feat: add durable account deletion`.
      No live release acceptance before Task 0's retention decision is recorded.

### Task 5: Add the Expo client and credential journeys

**Files:** modify `apps/mobile/{package.json,index.ts,app.json,tsconfig.json,README.md}`;
create `apps/mobile/app.config.ts`, `src/app/{_layout.tsx,index.tsx}`,
`src/app/(auth)/{sign-in.tsx,sign-up.tsx,verify-email.tsx,forgot-password.tsx,reset-password.tsx}`,
`src/app/auth/callback.tsx` and `src/app/(account)/index.tsx`.
Remove the obsolete empty `src/app.tsx` once Router owns the entry.
Create `src/features/auth/{auth-client.ts,secure-session-store.ts,session-controller.tsx,
api-client.ts,errors.ts,language.ts,strings.en.ts,strings.fr.ts}` and
`src/features/auth/screens/{sign-in-screen.tsx,sign-up-screen.tsx,verify-email-screen.tsx,
forgot-password-screen.tsx,reset-password-screen.tsx,account-screen.tsx}`,
and the approved canonical `src/design/colors.ts`. Update only mobile dependencies
in the root lockfile; record real journeys in `e2e/mobile/authentication.md`.

**Interfaces:** `createAuthClientForSession(storage): AuthClient` remains within
the feature; `fetchAccount(signal?: AbortSignal): Promise<AccountView>` validates
the approved `/api/me` shape at runtime. Define the matching client wire type
and validator locally in `api-client.ts`, without importing API application code.
`SessionController` exposes
`refresh()`, `signOut()`, `beginAccountChange()` and a state union of `loading`,
`authenticated`, `signed-out`, `verification-required`, `offline`, `unavailable`.
Only `authenticated` includes `AccountView`; offline/unavailable are not success.
Route files perform routing/render feature screens, not auth/persistence logic.

- [ ] Satisfy the Mobbin/palette gate before flow source. Use the SDK-aware Expo
      installer with the exact compatible pins, set the entry to import
      `expo-router/entry`, include `app.config.ts` in strict checking and configure
      Router/SecureStore/Apple plugins. Supply verified native IDs through config;
      no registration or signing artifacts enter Git. Configure the approved
      `gloups-health` scheme and environment-isolated storage/cookie prefixes.
- [ ] Create the official React auth client with `expoClient`, one active
      SecureStore adapter, matching server cookie prefix and session-data caching
      disabled. Use the official `inferAdditionalFields` client plugin for
      `preferredLanguage` without importing the server instance/types. Store no
      credentials in AsyncStorage. The feature owns a session
      generation/write gate: retire pending requests, reject stale state/storage
      writes, clear owned keys and only then activate a new account/client. Reuse
      the same storage instance for clients accessing the same active data.
- [ ] For app API fetches, use `authClient.getCookie()`, explicit Cookie and
      `credentials: "omit"`. Revalidate session and `/api/me` on start/foreground,
      validate response ownership against the active generation, and distinguish
      401/403/429/503/offline. No fabricated cached-account success or endless spinner.
- [ ] Build en/fr registration, sign-in, verification/resend and password recovery
      screens with native inputs, password manager/autofill/paste, accessibility
      and keyboard handling. Unicode display names are optional. Submit bounded
      language preference, never infer a country. Consume one-time email links in
      warm/cold launches, clear token-bearing navigation state promptly and never
      persist/log the URLs. A callback must revalidate before protected navigation.
- [ ] Online sign-out revokes remotely and clears local state; offline sign-out
      clears local state and reports unconfirmed remote revocation. Do not keep
      a general credential in a background retry queue. Cancel/drop old requests,
      including responses delayed until after sign-out or another account's login.
- [ ] Run installed Expo dependency/config checks, Ultracite, typecheck and iOS/
      Android exports; these are static gates only. Then run **MOBILE-01/02/03/04/05**
      with the real API on the assigned regular iPhone, iPhone Duo and Android:
      credential/verification/recovery, warm/cold links, foreground/offline/failure,
      sign-out/relaunch/reinstall, two-account switching, delayed responses and
      SecureStore write races. Record actual devices/runtimes and all restrictions.
- [ ] Check en/fr catalog parity, regional-format independence, light/dark,
      large text, screen readers and native layout. Commit
      `feat: add Expo credential authentication journeys`.

### Task 6: Complete mobile social, linking and deletion journeys

**Files:** create `src/features/auth/{social-sign-in.ts,native-apple.ts,
account-lifecycle.ts}` and `src/features/auth/screens/{sign-in-methods-screen.tsx,
delete-account-screen.tsx}` under mobile; extend `screens/account-screen.tsx` and add
`src/app/(account)/{sign-in-methods.tsx,delete-account.tsx}`; extend feature strings,
session controller, `src/app/(account)/index.tsx`, callback routes and the mobile
Army record. Reuse the existing
canonical colors and approved Mobbin references.

**Interfaces:** `signInWithGoogle(): Promise<void>`, `signInWithApple(): Promise<void>`,
`linkSignInMethod(provider: "google" | "apple"): Promise<void>` and
`deleteCurrentAccount(idempotencyKey: string): Promise<DeletionReceipt>` belong to
the feature service; screens never manufacture actor IDs or store provider tokens.

- [ ] Google and Android Apple use `authClient.signIn.social` with the allowlisted
      callback; await the result and explicitly refresh session/account before
      navigation. Handle cancellation/denial/interruption separately from success.
- [ ] On iOS use `expo-apple-authentication` availability/native button and Expo
      Crypto's 32 random bytes for each nonce. Create the bound server challenge,
      send its SHA-256 nonce value to Apple and forward code/original nonce to
      the native endpoint via the official client's `$fetch` at the absolute API
      URL. Its official Expo plugin processes returned auth cookies; verify that
      path on device, then refresh session/account. Native linking uses a fresh,
      actor-bound challenge. Never introduce a community native Google package.
- [ ] Preserve first-only Apple name fields without treating them as identity
      proof. Handle relay/different emails and revoked/unavailable credentials;
      report verified revocation to the server and clear local access. Test Apple
      credential-state behavior on a physical iPhone, not only the simulator.
- [ ] Add explicit method management: same-email conflict leads to existing-method
      sign-in and explicit link; require fresh proof, reject a subject owned by
      another account and preserve the last usable method/UUID. Never automatically
      merge separate accounts or overwrite profile data from a provider.
- [ ] Add confirmed deletion using a stable per-attempt UUID retry key. Show
      Gloups deletion and pending/manual Apple revocation distinctly; immediately
      retire the account session after acceptance. An interrupted response must
      not restart product access or tell the user everything completed. No hidden
      unauthenticated deletion-status endpoint or background account switching.
- [ ] Run **MOBILE-06/07/08** and the actual provider cases from Task 3 on all
      relevant devices: native/browser successes and cancellation, relay identities,
      stale fresh-auth prompts, partial-link reconciliation, deleting from one
      device while another requests data, and provider failure/manual fallback.
      Complete en/fr/accessibility checks and commit
      `feat: complete mobile identity lifecycle`.

### Task 7: Integrate, verify the full matrix and hand off

**Files:** the approved execution packet/registry, API/mobile README files,
`e2e/api/authentication.md`, `e2e/mobile/authentication.md`, SERVICES/DESIGN where
new actual facts exist, and dated implementation verification evidence. Product
fixes remain within the files/interfaces owned by Tasks 1–6.

**Interfaces:** consumes all accepted task outputs; produces a merged, evidenced
authentication slice or an explicit incomplete status with missing journeys.

- [ ] Perform the end-to-end cross-device flow once the integrated code exists:
      create/verify, sign in using each method, link/unlink, restart/foreground,
      recover a password, revoke sessions, switch accounts and delete with pending
      provider recovery. Exercise the five Review Focus conditions with real
      HTTP/database/device evidence; rerun only affected cases after fixes.
- [ ] Review actual import direction, dependency declarations, generated SQL,
      startup validation, proxy/origin policy, secrets/log payloads and owned-path
      diff. Confirm no health domain, operator surface, source cutover, new provider
      registration, generated native project or CI workflow entered the branch.
- [ ] From root run frozen install, Ultracite fix/check/doctor where setup changed,
      `bun run typecheck`, `bun run build`, `bun run changeset:status` and the graph
      dry-run. Record executed versus cached tasks. Static success cannot replace
      missing Army, native Apple, provider/email or device journeys.
- [ ] Record final revision, PRs, exact commands/case results, synthetic versus
      actual providers, devices/runtimes, remaining retention/service decisions,
      server/port/volume ownership and cleanup. Stop only this lane's processes;
      preserve user-owned/needed ignored state. Remove disposable synthetic data
      only after its evidence is captured and cleanup ownership is clear.
- [ ] Commit/push/PR/merge under the authorized Git workflow, attach created PRs,
      and update the packet to Done only when its required acceptance is complete.
      Keep deployment/store distribution and worldwide availability as separate
      decisions. A local auth slice is not the full Gloups health coach release.

## Plan self-review and next action

The writing-plans self-review is performed by the planning owner, not delegated.
The spec-to-task map is: versions/runtime/mounting/migrations → Task 1;
account/session/email/security/international errors → Task 2;
browser/native Apple/linking/consent revocation → Task 3;
deletion/retry/retention → Task 4; mobile session/credential/language/design →
Task 5; mobile social/lifecycle → Task 6; complete device/evidence/Git matrix →
Task 7. Task 0 owns every external/ownership prerequisite. Each Review Focus item
has named real-boundary cases; no unit-test/TDD step is included.

Before execution, review this plan's new implementation bindings and choose
native sequential execution or subagent-driven execution. Recommend native
sequential execution for the shared auth/migration/session changes. The coordinator
then records the approved `AUTH-003` packet described above; any parallel split
needs separately assigned paths/interfaces and isolated resources first.

## Primary references checked for planning

- [Approved spec](../specs/2026-10-28-authentication-design.md) and its sources;
  [PostgreSQL version policy](https://www.postgresql.org/support/versioning/),
  [Node releases](https://nodejs.org/en/about/previous-releases), public npm and
  official PostgreSQL image manifest metadata. No runtime/image was started.
- [Better Auth Fastify](https://better-auth.com/docs/integrations/fastify),
  [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle),
  [schema CLI](https://better-auth.com/docs/concepts/cli),
  [stable sign-in source](https://github.com/better-auth/better-auth/blob/v1.7.14/packages/better-auth/src/api/routes/sign-in.ts),
  [email verification source](https://github.com/better-auth/better-auth/blob/v1.7.14/packages/better-auth/src/api/routes/email-verification.ts),
  [Drizzle transaction option](https://github.com/better-auth/better-auth/blob/v1.7.14/packages/drizzle-adapter/src/drizzle-adapter.ts)
  and [Expo cookie handling](https://github.com/better-auth/better-auth/blob/v1.7.14/packages/expo/src/client.ts).
- [Expo Router installation](https://docs.expo.dev/router/installation/),
  [SDK 58 SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/),
  installed Expo bundled-module ranges and registry peer metadata. Installed Bun
  and Turborepo help were inspected; future CLI flags still require the pinned
  installed tools' help during implementation.
