# Authentication design: Better Auth, NestJS and Expo SDK 58

Date: 28 October 2026. Status: Approved by owner for implementation planning.
Approved design revision: `0b55294aa375078fc43550d66647e220896e9eb0` (PR #22).
Owner/integration coordinator: Codex, current authentication chat. Scope:
[AUTH-001](../tasks/AUTH-001-better-auth.md).

## Intent and authority

Give Gloups users one account across iOS and Android before health features are
implemented. [D015](../DECISIONS.md#d015-authentication-direction) confirms Better
Auth in NestJS/Expo SDK 58, official integrations/plugins only, and Google, Apple
and email/password. The owner chooses native Apple on iOS, browser Google on both
platforms and browser Apple on Android.

[D016](../DECISIONS.md#d016-api-adapter-persistence-and-dependency-direction)
confirms NestJS's official Fastify adapter, Drizzle ORM, and DDD with Onion
architecture. These replace the initial Express/direct-database proposal.

The owner approved this revised design on 28 October 2026 and explicitly selected
PostgreSQL under [D017](../DECISIONS.md#d017-authentication-design-approval-and-postgresql).
The approval covers the documented behavior/defaults; choices explicitly left
to the implementation plan or owner remain open. The
[implementation plan](../plans/2026-10-28-authentication-implementation.md) records
those implementation choices and execution prerequisites for review. Design
approval does not by itself assign product execution, configure providers or
authorize deployment/distribution.

## Existing foundation and boundaries

The mobile workspace pins Expo `58.0.20`, React Native `0.88.0` and React `19.3.0`.
It renders an empty native root and has no router, scheme, account storage or
provider connection. `apps/api` contains instructions only. Bun `1.4.4`, the root
lockfile, strict TypeScript, Turborepo and Ultracite are already configured.

This slice establishes authentication, protected account access, recovery,
explicit linking and account deletion for its own records. It does not introduce
health domains, onboarding eligibility, purchases, analytics payloads, a product
web app, guest accounts, passkeys, phone login or operator/admin access. Operator
MFA/access controls need a separate packet before any operator surface exists.
Existing identity resources and source data are preserved; there is no cutover.

## Approaches and selected direction

The owner considered two official-only social approaches:

| Approach                                              | Tradeoff                                                                                  | Choice                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| Browser OAuth for Google and Apple on both platforms  | Fewest native modules; Apple on iOS leaves the native authentication sheet unused         | Not selected                       |
| Native Apple on iOS; browser Google and Android Apple | Native iOS interaction; adds nonce, native audience and Apple authorization-code handling | Selected by owner, 28 October 2026 |

For NestJS, use its official Fastify adapter. Bootstrap with `FastifyAdapter`
from `@nestjs/platform-fastify` and keep Better Auth behind its documented
Fastify-to-Web-Request integration. Use the official
`@better-auth/drizzle-adapter` for persistence. The HTTP bridge and Nest guard
are application-owned adapters around official APIs, not a community NestJS
plugin. Better Auth remains the authentication engine; Gloups owns its account
and authorization rules through DDD/Onion boundaries.

## Versions and compatibility

The npm registry was checked on 28 October 2026. These are candidate exact pins
for the later implementation packet, not installed authentication dependencies:

| Component                                                    | Candidate           | Review basis                                                                           |
| ------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------- |
| `better-auth`, `@better-auth/expo`, `auth` CLI               | `1.7.14` each       | Registry stable tags agree; supplied 1.8 Expo excerpt is beta                          |
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify` | `12.3.2` each       | Matching stable framework packages; official Fastify adapter                           |
| `fastify`, `@fastify/cors`                                   | `5.12.7`, `11.3.1`  | Match the reviewed NestJS adapter dependencies                                         |
| `@better-auth/drizzle-adapter`                               | `1.7.14`            | Official Better Auth adapter; supports the stable Drizzle candidate                    |
| `drizzle-orm`, `drizzle-kit`                                 | `0.45.4`, `0.31.11` | Registry stable releases; do not copy RC install commands from version-1 documentation |
| `reflect-metadata`, `rxjs`                                   | `0.2.2`, `7.8.2`    | Stable NestJS peers                                                                    |

Use the server's documented Node ESM runtime with the repository's Node
`>=24.15.0` requirement; Bun remains the package/workspace tool. The implementation
packet must pin the actual server runtime and PostgreSQL version/image digest,
review all direct pins again, and define emitted Node ESM/decorator settings
without weakening shared authored-code checks. No API runtime has been exercised.

Drizzle still needs a database driver. Select and pin a compatible PostgreSQL
driver in the implementation packet, encapsulated by Drizzle infrastructure.
The earlier `pg` version was a driver pin; the rejected integration also bypassed
Drizzle with a direct pool. The current contract requires Drizzle for both auth
and Gloups persistence, with no driver client exposed to inner layers.

SDK 58's installed `expo/bundledNativeModules.json` lists compatible ranges:
AppleAuthentication `~58.0.2`, Crypto `~58.0.7`, SecureStore `~58.0.2`, Network
`~58.0.4`, Constants `~58.0.13`, Linking `~58.0.14` and WebBrowser `~58.0.7`.
Resolve and pin exact compatible patches through the SDK-aware Expo installer
during implementation. The Better Auth Expo peer ranges permit these SDK modules
and React 19; this is metadata compatibility only. Native verification remains
required. Keep Metro package exports enabled. Do not copy SDK 55 or beta-specific
setup into SDK 58 without checking the installed stable APIs.

## Server composition and persistence

- Use one NestJS service and one Better Auth instance, with `expo()` from
  `@better-auth/expo` on the server. Enable built-in Google/Apple providers and
  email/password; no community auth wrapper or replacement token stack.
- Keep Better Auth at `/api/auth` through a scoped Fastify route/plugin beneath
  Nest's official adapter. Convert the original method, path/query, headers and
  body to a standard `Request`, call `auth.handler`, and forward its `Response`.
  Use the configured canonical base URL; do not trust an arbitrary Host header.
  Configure body parsers only within that auth scope to preserve original bytes,
  with body limits, for JSON and Apple form-encoded POST callbacks. Do not
  JSON-stringify a parsed form or read an already-consumed Node stream. Normal
  Nest/Fastify JSON parsing remains available outside this scope.
- Forward status, redirect location, content type and body without rewrapping
  auth responses. Preserve each `Set-Cookie` header separately, including cookie
  deletion/chunks; never combine them with commas. Configure Fastify CORS before
  the auth routes and verify preflight. Register the raw Fastify routes once,
  independently of Nest controller prefixes, without doubling `/api`.
- Register a thin Nest global guard through dependency injection. It delegates
  to application use cases/ports for verified identity and account resolution.
  A Better Auth infrastructure adapter calls `auth.api.getSession` with
  `fromNodeHeaders` and maps the result to a framework-neutral principal. Require
  a valid database-backed session and verified email. Public routes are explicitly
  allowlisted; auth routes retain Better Auth's own protocol checks. Database or
  provider failure yields unavailable and no domain access.
- Drizzle ORM and PostgreSQL are confirmed. Configure
  the official `drizzleAdapter(db, { provider: "pg", schema })` in infrastructure;
  `"pg"` is the adapter's dialect identifier, not a direct-pool architecture.
  Both auth tables and Gloups repositories use the Drizzle database boundary.
  Pass the generated schema explicitly and preserve its model/property mappings.
- Generate the auth Drizzle schema with the pinned Better Auth CLI, then generate,
  review/version and apply SQL migrations through Drizzle Kit. Include the
  Gloups mapping/unique constraints in the same ordered migration history.
  Do not use Better Auth's direct-adapter migration path or unreviewed schema
  push as the delivery mechanism. Never migrate at API startup or against a source
  database. Exercise ordered migration/recovery against an isolated database;
  no database is provisioned by this specification.
- Better Auth owns user, provider/credential account, session and verification
  records. Its `account` model is an authentication method, not a Gloups account.
  Store an independent immutable Gloups UUID with a unique `authUserId` binding.
  Provision it transactionally on the first verified protected request using
  unique constraints/idempotent insertion; concurrent calls return one UUID.
  Mapping failure yields unavailable and no domain access. Never map by email.
- The proposed first application endpoint is `GET /api/me`, returning only
  `{ account: { id }, user: { name, email, emailVerified } }` for the verified
  caller. It never returns password hashes, cookies, session/provider tokens or
  accepts an owner parameter. The guard attaches a server-owned account context;
  later domain handlers cannot replace it with request-supplied IDs.

## DDD and Onion boundaries

Follow the accepted [API architecture](../ARCHITECTURE.md#ddd-and-onion-architecture)
and the owner's [NestJS/DDD/Onion reference](https://medium.com/@patrick.cunha336/structuring-a-nestjs-project-with-ddd-and-onion-architecture-65b04b7f2754).
Organize by bounded context, starting with identity/access. The domain owns
Gloups account identity and lifecycle invariants; Better Auth's provider-account
record is an external persistence model, never the domain aggregate.

Proposed layout, not directories authorized to create now:

```text
apps/api/src/modules/identity-access/
  domain/           GloupsAccount, value objects, invariants, repository contracts
  application/      resolve account, link identity, delete account; use-case ports
  infrastructure/   Better Auth adapter, Drizzle schema/repositories/mappers, email
  presentation/     Nest controllers/guards, Fastify auth bridge, HTTP DTO mapping
  identity-access.module.ts
```

Domain code is plain TypeScript with no NestJS, Fastify, Better Auth, Drizzle or
driver imports. Application code depends on domain and its own ports; it does
not import infrastructure or transport DTOs. DTOs inside the application are
plain input/output data; decorated/validated HTTP DTOs stay in presentation.
Infrastructure implements the inner contracts and maps rows/provider results
into domain/application values. Presentation translates HTTP and invokes use
cases; it does not implement account provisioning, linking or deletion rules.

Nest modules and the bootstrap are the outer composition root. Bind ports to
infrastructure using injection tokens/factories there; keep Nest decorators
outside the domain/application core. Use cases own transaction/retry intent
through a unit-of-work port, whose Drizzle implementation binds repositories to
one transaction without exposing Drizzle transaction types. Cross-context
consumers use approved application contracts, never another context's tables or
concrete repositories. Add only the abstractions needed by these actual use cases.

## Mobile and session boundary

Use `createAuthClient` from `better-auth/react` with `expoClient` from
`@better-auth/expo/client` and one SecureStore adapter instance. Store cookies in
SecureStore, with isolated development/release prefixes and matching cookie
prefix configuration. Do not use AsyncStorage, logs or URL parameters to persist
session credentials. Disable the optional client session-data cache initially
so persisted display data cannot masquerade as current authorization.

Use official Expo Router for authentication navigation and callback routing;
the later packet must enumerate its SDK 58 dependencies/configuration and replace
the empty shell entry deliberately. Until references/tokens are approved, no
screen/component/navigation source is authorized by this document.

For native application API requests, attach `authClient.getCookie()` explicitly
as the `Cookie` header and use `credentials: "omit"`. The Expo plugin handles its
own auth requests. Use reachable device URLs: a phone's `localhost` is not the
developer's API. No secret or private provider credential is `EXPO_PUBLIC_*`.

Approved session policy: database-backed sessions, seven-day sliding expiry,
24-hour refresh interval and five-minute freshness for destructive/linking
operations. Keep server cookie caching disabled so revocation applies to the next
request. Use HTTPS/Secure cookies in release, explicit trusted origins, CSRF and
origin checks enabled, and database-backed endpoint rate limits. Proxy/IP trust
and concrete rate budgets belong to the implementation packet, with exercised
429/backoff behavior; do not trust arbitrary forwarded headers.

The proposed app scheme is `gloups-health`, distinct per environment where needed.
Confirm actual identifiers and collision policy before native/provider config.
Allow only required schemes and callback destinations. Development `exp://`
origins are environment-scoped and absent from release. Include Apple's required
origin for its callback; no wildcard production origins or arbitrary return URLs.

On launch/foreground, revalidate before opening protected content. Distinguish
loading, authenticated, signed out, email verification required, offline and
service failure. Navigation success requires a verified server session and
internal account, not a browser-close event. If a user signs out/switches account,
clear account-scoped memory/requests/storage before showing the next account;
late responses from the previous session must be discarded.

Online sign-out revokes the current server session and clears local credentials.
Offline sign-out clears local credentials/protected state and states that remote
revocation could not be confirmed; it must not promise other devices are signed
out. Reauthentication permits revoking remaining sessions. Never keep a general
API credential in a retry queue after local sign-out. Reinstallation or cached
SecureStore state must still pass server validation.

## Provider flows

### Google and Android Apple

Use `authClient.signIn.social` through the official Expo browser integration.
The server owns Google/Apple OAuth callbacks, state/code validation and provider
secrets. The app supplies an allowlisted callback route and navigates explicitly
after session/account validation. Handle cancellation, duplicate callbacks,
process interruption, provider denial/outage and invalid state without creating
a false success. A repeated sign-in to the same provider subject preserves the
same account. Do not use a community Google React Native auth plugin.

Use minimal identity scopes. Google's OAuth web client and Apple's Service ID
callbacks point to the environment's HTTPS `/api/auth/callback/google` and
`/api/auth/callback/apple`. Reuse authorized existing registrations after inventory;
do not create projects/identifiers automatically. Apple secrets need managed
rotation before expiry. Register relay email delivery where applicable.

### Native Apple on iOS

Use official `expo-apple-authentication` and its native button, availability check
and capability. Generate a cryptographic per-attempt nonce using Expo Crypto;
pass the corresponding nonce with the ID token to Better Auth's official Apple
sign-in API. The reviewed stable provider supports exact or SHA-256 nonce
comparison. Require a nonce, verify issuer/signature/expiry and the configured
native audience, and reject missing/mismatched nonce and wrong audiences. The
browser Service ID and native bundle ID are separate allowed audiences.

Handle cancelled/missing credentials and first-sign-in-only name/email fields.
Do not fabricate a name, treat a relay address as a different account, infer a
country or replace an existing name with a later null value. An absent display
name is allowed by Gloups; where Better Auth needs a string, preserve its empty
value until the user explicitly supplies a name. Account ownership always uses
the verified subject/mapping, never client-supplied profile data.

The native authorization code must also reach a server-owned exchange boundary
so Apple revocation credentials can be obtained. Bind the exchange result to the
same verified Apple subject/audience, keep any refresh/access token encrypted on
the server and reject expired/reused codes. The later implementation plan must
specify this boundary and session/cookie propagation using the pinned official
Better Auth APIs and Apple's token endpoint; a plain ID-token-only sign-in is
insufficient evidence for account-deletion readiness. No custom JWT/signature
implementation or community plugin is permitted. Failure to persist the needed
revocation material must prevent reporting a completed native account setup.

Handle native credential-revoked events and server-side Apple consent-revoked
notifications: validate their source, revoke affected Gloups sessions and require
authentication again. Do not silently interpret a provider-consent change as a
request to delete Gloups health records. Record actual physical-device evidence
for credential-state checks; simulator-only behavior is insufficient.

## Email/password and identity lifecycle

| Journey                | Approved behavior                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration           | Collect email, password and an optional display name; map absent name to the provider-required empty string. Require email verification before protected access and disable automatic credential sign-in before verification. Passwords: minimum 15, maximum 128 characters; allow password managers/paste and preserve user input. Better Auth owns hashing. |
| Verification           | Use the built-in verification flow and one-hour link lifetime. Allow resend with throttling. The HTTPS server link validates the token, then returns to an allowlisted app route. Recheck the session; a link alone does not grant UI access. Expired/used/malformed links offer a resend path.                                                               |
| Recovery               | Generic accepted response for reset requests, no account-existence disclosure; one-hour, single-use reset links. On success revoke existing sessions and require sign-in again. No passwords/tokens in diagnostics or email subject lines.                                                                                                                    |
| Linking                | Set `disableImplicitLinking: true`; keep explicit linking enabled. Same-email provider sign-in does not merge accounts. The user first authenticates with an existing method, completes fresh verification and explicitly links the new method. Subject already bound elsewhere fails.                                                                        |
| Relay/different emails | Allow different-email linking only through the authenticated fresh linking flow after proof of both identities. This permits Apple relay addresses without merging independently created Gloups accounts. Keep existing account profile/email unchanged on link.                                                                                              |
| Adding a password      | Social users prove mailbox ownership through the reset/set-password flow; an email lookup or social display value never authorizes a credential addition.                                                                                                                                                                                                     |
| Unlinking              | Require fresh authentication and preserve at least one usable sign-in method. Removing one method never deletes health data or changes the Gloups UUID.                                                                                                                                                                                                       |
| Email changes          | Disabled for this initial slice; a later verified-change contract must precede enabling the endpoint.                                                                                                                                                                                                                                                         |

Auth email delivery uses server-side verification/reset callbacks behind an
injected transport. The email provider, verified sender/domain, authorized
recipients, retention and French/English templates must be selected/configured
before live acceptance. Use a local HTTP email sink with synthetic identities
for local E2E; this does not prove actual delivery or authorize messages to people.
Do not select a paid service or reuse a source sender implicitly. Missing required
release configuration fails startup; email delivery failure is observable and
retryable without claiming the message was delivered.

### Account deletion

Expose one fresh-authenticated Gloups deletion command, with explicit in-app
confirmation and stable retry identity. Disable the uncoordinated Better Auth
delete-user endpoint. First mark the internal account deleting and revoke all
sessions so retries, callbacks and another device cannot access/recreate its
domain account. Persist a durable deletion job/tombstone before external calls.
Delete this slice's personal auth/account data and clear device state without
waiting for an external provider outage to end. Revoke Apple provider tokens
using the official endpoint; retain only the minimal protected token/job material
needed for retries, then delete it. Report Gloups deletion and pending Apple
revocation distinctly rather than claiming everything completed. If usable
revocation material is missing, still fulfill Gloups deletion and offer Apple's
manual revocation route; do not retain the whole account indefinitely.

The accepted deletion contract must define tombstone/audit/backup retention and
re-registration after completion before live release; no duration is invented
here. Until completed, the identity binding remains reserved and unusable.
Later domain/media/queue packets must join this deletion boundary before they
can accept real data. Existing-source deletion/migration remains out of scope.

## International, design and error behavior

Use complete English/French message catalogs for screens, accessibility, emails,
validation and recovery. Resolve language per [I18N](../I18N.md); language does
not choose country, residency, units or timezone. Preserve Unicode names and
email handling supported by the provider; do not implement provider-specific
dot/plus-address rewriting. All auth lifetimes use UTC server instants.

Preserve stable Better Auth error codes inside the auth protocol. Map app-owned
failures to language-neutral codes, distinguishing authentication required (401),
email verification required (403), linking conflict (409), throttling (429) and
service unavailable (503), with request correlation and safe retry information.
Never return raw provider errors, passwords, tokens or another account's details.
Final app error shapes are proposed inputs to FND-001, not accepted shared exports.

Before any new screen/flow source, inspect actual connected Mobbin references and
record neutral selected links in [DESIGN](../DESIGN.md), then import the existing
canonical brand tokens under an approved scope. No Mobbin tool/plugin was found
in the session inventory/search, and no screens/references were inspected. This
remains a dependency before UI work, not fabricated design evidence. Native
review covers keyboard/autofill, secure text entry, light/dark, large text,
screen readers, iPhone Duo layout and reduced motion.

## Acceptance and next implementation packet

E2E Army must exercise the running service with isolated PostgreSQL and the real
mobile app. No agent-written/modified unit tests or TDD. Capture revision,
commands, actual device/runtime, synthetic versus live-provider boundaries and
limitations. The later packet must allocate exact API/database/Metro ports and
device ownership; this specification reserves none.

| Boundary                     | Required observed result                                                                                                                                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API mounting                 | Under Nest's Fastify adapter, preserve JSON and Apple form-encoded callback bytes, method/path/query, redirect status/location and multiple `Set-Cookie` headers, including expiry/chunks. Ordinary Nest JSON routes and CORS/preflight still work; no doubled prefix or consumed body.                                            |
| Architecture and persistence | Review actual imports/DI for inward dependencies and port implementations; domain/application contain no framework/ORM/provider imports. Apply reviewed Drizzle migrations to an empty isolated PostgreSQL database; both auth and Gloups writes use Drizzle, and rollback of a failed account use case leaves no partial mapping. |
| Credentials                  | Register, resend/verify, sign in, reject unverified/wrong password, reset/replay/expire, throttle and revoke sessions over actual HTTP; inspect persisted synthetic records.                                                                                                                                                       |
| Isolation                    | Missing/forged/expired/revoked cookies fail; two identities get distinct UUIDs; repeated/concurrent bootstrap gets one UUID; caller owner IDs cannot alter context; DB failure fails closed.                                                                                                                                       |
| Persistence                  | API/database restart preserves valid mapping/session state; session expiry and revocation apply on the next protected request.                                                                                                                                                                                                     |
| Social/native                | Actual Google on iOS/Android, native Apple on iOS and Apple browser on Android; cancel/deny/interrupt/retry, wrong audience/nonce/state, duplicate callbacks, relay identity and missing repeat profile fields. Verify authorization-code exchange/revocation persistence.                                                         |
| Lifecycle                    | Explicit same/different-email linking, conflicting subject and last-method removal; sign-out/relaunch/offline local sign-out; another device's revoked session fails; account switching discards late responses.                                                                                                                   |
| Deletion                     | Synthetic account's sessions/mapping/auth records become unusable, Apple revocation succeeds or remains durably pending, concurrent retry cannot recreate ownership, and device credentials are removed.                                                                                                                           |
| Mobile/international         | Regular iPhone, iPhone Duo and Android with exact runtime recorded; English/French, supported regional formatting, accessibility and deep links from email/browser in warm/cold launches.                                                                                                                                          |

Static gates use existing root commands and later approved API/mobile tasks:
frozen Bun install, Ultracite fix/check, relevant strict typechecks/builds and SDK
checks. Inspect Turborepo's actual graph before adding tasks. Exports do not prove
native/provider behavior. Git integration follows local checks; exhausted Actions
usage is not a gate. Deployment, purchases and distribution require separate scope.

Design approval is recorded above. Before code, the coordinator records accepted
auth interfaces and an implementation packet with exact allowed/shared paths, runtime
pins, migration ordering, native Apple exchange and deletion retention decisions.
Resolve the email/provider inventory and Mobbin access/reference dependency before
the corresponding live-provider/UI work. The implementation plan can split
service/email acceptance from mobile/provider acceptance but cannot mark the
whole authentication slice Done while required journeys are missing.

## Sources checked

- [Stable documentation index](https://better-auth.com/docs/llms.txt) and
  [version selector index](https://better-auth.com/llms.txt); supplied 1.7 index
  and 1.8-beta Expo excerpt were read separately.
- [Official NestJS Fastify adapter](https://docs.nestjs.com/techniques/performance),
  [official Better Auth Fastify integration](https://better-auth.com/docs/integrations/fastify),
  [NestJS integration status](https://better-auth.com/docs/integrations/nestjs),
  [NestJS guards](https://docs.nestjs.com/guards) and
  [official Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle).
- [Drizzle PostgreSQL drivers](https://orm.drizzle.team/docs/get-started-postgresql),
  [Drizzle migrations](https://orm.drizzle.team/docs/migrations),
  [Fastify content parsers](https://fastify.dev/docs/latest/Reference/ContentTypeParser/)
  and [Fastify reply headers](https://fastify.dev/docs/latest/Reference/Reply/).
- The owner's [NestJS/DDD/Onion reference](https://medium.com/@patrick.cunha336/structuring-a-nestjs-project-with-ddd-and-onion-architecture-65b04b7f2754)
  and [Onion architecture's dependency direction](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/).
- [Official Expo integration](https://better-auth.com/docs/integrations/expo),
  [Expo AppleAuthentication](https://docs.expo.dev/versions/v58.0.0/sdk/apple-authentication/),
  installed SDK 58 module metadata and npm package stable/peer metadata.
- [Google provider](https://better-auth.com/docs/authentication/google),
  [Apple provider](https://better-auth.com/docs/authentication/apple),
  [stable Apple provider source](https://github.com/better-auth/better-auth/blob/v1.7.14/packages/core/src/social-providers/apple.ts),
  [email/password](https://better-auth.com/docs/authentication/email-password),
  [users/linking](https://better-auth.com/docs/concepts/users-accounts),
  [sessions](https://better-auth.com/docs/concepts/session-management) and
  [options](https://better-auth.com/docs/reference/options).
- [Apple account deletion and revocation](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple)
  and [token revocation endpoint](https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens).

Source examples explain library capabilities. The proposed defaults and extra
Gloups ownership/deletion safeguards above are design choices, not claims that
the libraries implement the complete product behavior automatically.
