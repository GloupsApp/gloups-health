# Authentication architecture and review stack

Date: 29 October 2026. Owner: AUTH-003 coordinator in 015e. Base source:
`ada0ca072384bec24557af2d43cb853165b65fce`; main assignment:
`fbe808edcf8c8ce18b2083b0fab5c5af8ee7eac6` (PR #25). The owner requested use of
Nest's full documentation, stronger DDD/Onion boundaries and concern-focused
review PRs after finding PR #26 too large. The approved authentication scope and
no-merge/no-auto-merge rule remain; no new product behavior is inferred.

## Source correction

The prior folders kept imports inward, but did not adequately separate wiring,
transaction ownership, transport validation or worker setup. The refactor adds:

- Small private Nest modules and explicit exports for identity persistence/use
  cases, authentication, credential HTTP, social HTTP and deletion. The public
  feature root exports no SDK/database resource.
- Validated ConfigModule composition and official named DrizzleModule databases;
  readiness and connection shutdown use Nest lifecycle hooks. Bootstrap has no
  direct feature SDK/database lookup.
- APP_GUARD/APP_FILTER bindings, typed current-actor decorators, schema-backed
  pipes and origin/budget guards. Controllers no longer call SDK APIs or import
  Drizzle implementations. Protocol gateways preserve official SDK responses.
- Separate account/deletion work ports, with aggregate beginDeletion/save and
  immutable identity-pair checking. Core is plain TypeScript; actual Oxlint
  overrides enforce inward imports and exclude persistence from presentation.
- A Nest standalone worker graph sharing deletion providers, with current-tick
  draining before managed database shutdown. SDK policy/request effects/DB
  hooks/proof admission/fingerprints are separate leaf adapters.
- Concern-focused real E2E suites and explicit generated-metadata review rules.
  Authored SQL stays visible. No unit tests, TDD or production setup.

## Observed checks

Official registry metadata verified new exact dependencies: @nestjs/config 12.0.1
and @nestjs/drizzle 0.0.2. Both declare Nest 12 compatibility; the Drizzle peer
range includes existing 0.45.4. postgres.js 3.4.9 is unchanged. The official full
Nest documentation and Drizzle/configuration/module/lifecycle/standalone/pipe
chapters were read. No separate authentication engine was introduced.

The first boot identified a missing config import in the deletion HTTP module;
the scoped DI binding was corrected. Splitting SDK policy identified a private
request-scope reference; a narrow getter keeps the storage private. No failed
build or boot establishes acceptance. The corrected API compiled uncached.

Army actual HTTP/Postgres run 01a18721-087a-71d1-9763-1fbc1eb77d42:29/29 in 25.56s.
After aggregate persistence and suite extraction,
run 01a18728-8a38-77c9-8049-1863ed8b9de3:31/31 in 27.82s. Added platform cases
exercise real Nest/Fastify health after readiness and credential-capable CORS.
Worker drain run 01a1872c-8701-7fba-add1-1acf052a0c49:1/1 in 3.43s. Drizzle Kit
reports no schema changes, nothing to migrate. Root strict checks and API
compilation pass; new lint configuration doctor reports 8/8 with no warnings.

The review stack's exact branch/PR map, checkpoint evidence and cleanup are
recorded below when published. Live provider/native/sender/retention acceptance
remains pending; compilation or source restructuring does not supply it.

## Decisions and costs

- Keep the accepted behavior while correcting architecture and review granularity
  under the existing owner assignment — this is direct owner feedback within the
  approved packet — source/device/provider acceptance remains a separate gate.
- Keep core classes plain and bind them with Nest factories at composition — DDD
  requires inward contracts while Nest manages adapters and runtime lifecycle —
  decorators on core use cases are intentionally unnecessary.
- Use official ConfigModule/DrizzleModule, retaining the stable ORM and driver —
  named DI and managed lifecycle now have first-party support — the new exact
  dependencies need startup/shutdown and compatibility evidence.
- Retain the SDK's scoped protocol bridge and narrow gateways — raw bodies,
  redirects and cookie chunks are protocol contracts — those endpoints retain
  SDK-owned middleware while application commands use Nest's pipeline.
- Put public Apple budgets in Nest guards before body pipes — admission runs
  before payload work in the standard pipeline — malformed requests also consume
  their route budget; payloads/identities are never logged.
- Make the account aggregate transition part of deletion persistence — folder
  placement alone cannot enforce a domain invariant — transaction and race
  checks remain required over the real database.
- Split review through cumulative branches while preserving original source
  history — each diff must isolate one concern without breaking dependencies —
  review/merge order matters and every PR stays unmerged for the owner.
- Collapse only generated lock/snapshot metadata — owner review must focus on
  authored changes while retaining expandability — SQL remains fully visible.
- Preserve existing missing native/provider/physical-device and live release
  prerequisites — this refactor adds no live credentials or device evidence —
  release remains blocked until those independent gates are satisfied.

Final integrated source run `01a18735-52ac-7263-b2e3-b421916baeee`: **32/32**
actual HTTP/Postgres E2E checks passed in 28.72s, including signal-driven worker
draining. Root build passed 6/6 (3 cached) in 9.099s; API compilation and current
iOS/Android exports executed. Root strict tooling checks executed; unchanged
workspace typechecks used their recorded cache results. Ultracite fix/check
passed 252 files; doctor 8/8, no warnings. The authored source adds no schema
change. Mobile source is unchanged from the prior review; new native/provider
acceptance is not claimed. The source is preserved before extracting branches.
