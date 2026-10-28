# Decision register

Updated 28 October 2026. Confirmed decisions come from the owners' instructions.
A merged draft document is not approval of all its proposals.

| ID   | Decision                                                                                                                                                | State                                                                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D001 | One consumer Gloups health coach for sportspeople: nutrition, fitness, sleep and optional cycle                                                         | Confirmed                                                                                                                                                                       |
| D002 | Daily food/training/rest recommendations with clear explanations                                                                                        | Confirmed                                                                                                                                                                       |
| D003 | Full workout creation/execution, sets/reps/weights/timers/progression at first unified release                                                          | Confirmed                                                                                                                                                                       |
| D004 | Worldwide launch target; iOS and Android; French and English first                                                                                      | Confirmed                                                                                                                                                                       |
| D005 | NestJS backend direction                                                                                                                                | Confirmed                                                                                                                                                                       |
| D006 | HIPAA BAA/HDS support deferred; assess applicable consumer obligations                                                                                  | Confirmed                                                                                                                                                                       |
| D007 | New private GloupsApp/gloups-health; documentation before application work                                                                              | Confirmed                                                                                                                                                                       |
| D008 | Canny Free public roadmap; original French/English copy; no competitor references                                                                       | Confirmed                                                                                                                                                                       |
| D009 | No agent-written/modified unit tests or TDD; real-boundary E2E evidence                                                                                 | Repository policy                                                                                                                                                               |
| D010 | Local checks then commit/push/PR/merge; deployment/distribution separate; no reliance on Actions                                                        | Repository policy                                                                                                                                                               |
| D011 | Bun workspaces, Turborepo, Oxlint, Oxfmt, Ultracite, Changesets and Husky with Conventional Commits; latest stable versions pinned at setup             | Confirmed by owner, 28 October 2026; supersedes Nx and Bun 1.4.2 tooling policy                                                                                                 |
| D012 | Blume documentation site in apps/docs; apps/web remains reserved pending the web-app decision                                                           | Confirmed for tooling setup, 28 October 2026; product web framework remains open                                                                                                |
| D013 | Shared strict TypeScript configuration based on Blume, consumed by approved TypeScript projects                                                         | Confirmed by owner, 28 October 2026; see TOOL-002 for scope and limitations                                                                                                     |
| D014 | Expo SDK 58 / React Native mobile foundation with inherited strict TypeScript and Ultracite                                                             | Confirmed by owner, 28 October 2026; TOOL-003 approves the minimal bootstrap, not product flows or provider setup                                                               |
| D015 | Better Auth in NestJS/Expo SDK 58; official integrations/plugins only; Google, Apple and email/password; native iOS Apple, browser Google/Android Apple | Confirmed by owner, 28 October 2026; supersedes the earlier Clerk selection for new implementation; AUTH-001 specifies details and does not authorize product code              |
| D016 | NestJS official Fastify adapter, Drizzle ORM and DDD with Onion architecture                                                                            | Confirmed by owner, 28 October 2026; supersedes AUTH-001's initial Express/direct-pool proposal and the Prisma candidate for new persistence; implementation remains unapproved |
| D017 | Authentication design at PR #22 approved for planning; PostgreSQL selected with NestJS/Fastify, Drizzle and DDD/Onion                                   | Confirmed by owner, 28 October 2026; AUTH-002 writes the implementation plan; execution assignment and external setup remain separate                                           |
| D018 | Native authentication execution; owner reviews PRs before merge; no agent merges or auto-merge                                                          | Confirmed by owner, 28 October 2026; AUTH-003 executes the approved plan after the main-assignment gate; supersedes automatic Git integration for this work                     |
| P001 | Database hosting/version and detailed modular-service composition                                                                                       | PostgreSQL selected under D017; exact runtime/driver/module bindings are implementation-plan choices, hosting remains separate                                                  |
| P002 | Adults only; phone strength execution with imported/manual other activities                                                                             | Proposed                                                                                                                                                                        |
| P003 | Exact locale, temporal, sync and action wire schemas                                                                                                    | Requires domain contract review                                                                                                                                                 |

## Open owner decisions

| ID   | Needed decision                                                     | Affected work                                                 |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| O001 | Minimum age and supported populations                               | Eligibility, onboarding, consent and method validation        |
| O002 | Watch execution, phone GPS and structured endurance scope at launch | Platform adapters, session model and distribution scope       |
| O003 | Supported goals, evidence-backed methods and scientific reviewer    | Personalized food/training/rest and cycle guidance            |
| O004 | Recurring consumer operations/provider budget                       | Storage, inference, observability, backups and support        |
| O005 | Mioum users/data, transfer rights and preservation duties           | Source reuse, identity transition and any data migration      |
| O006 | Exact provider products/regions and market restrictions             | Privacy assessment, operations and worldwide release register |

Record the owner, date, decision, reason, affected contract/task and superseded
choice when resolving an item. A worker may settle routine implementation detail
inside an approved task. Product scope, provider purchases, public claims and
weaker controls cannot be approved by an agent marking its own assumption agreed.

## D015: Authentication direction

Owner: product owner, 28 October 2026. The owner selects Better Auth with NestJS
and the accepted Expo SDK 58 foundation and explicitly excludes the community
NestJS wrapper. Google, Apple and email/password are confirmed. The owner chooses
Expo's native Apple flow on iOS, browser Google on both platforms and browser
Apple on Android from the official-only alternatives.

This replaces the prior Clerk selection in active instructions and future
account-mapping contracts. Preserve existing Clerk resources and any source data;
this is not migration or deletion authorization. The rest of
[SERVICES](SERVICES.md) remains in effect. [AUTH-001](tasks/AUTH-001-better-auth.md)
owns the [authentication design](specs/2026-10-28-authentication-design.md).
Stable version proposals, database/session defaults and lifecycle behavior in
that design remain proposals until approved. FND-001 retains broader common
contracts. No implementation, provider change, deployment or distribution is
approved by this decision alone.

## D016: API adapter, persistence and dependency direction

Owner: product owner, 28 October 2026. The owner explicitly corrects the initial
AUTH-001 design to use NestJS's official Fastify adapter and Drizzle ORM and
reaffirms DDD with Onion architecture using the supplied
[NestJS architecture reference](https://medium.com/@patrick.cunha336/structuring-a-nestjs-project-with-ddd-and-onion-architecture-65b04b7f2754).
The purpose is to preserve the selected stack and an inward dependency rule:
business rules/use cases do not depend on HTTP, authentication SDKs or ORM types.

This supersedes the Express/direct-pool design proposal and Prisma as a new-service
ORM candidate. Drizzle needs a separately reviewed database driver inside
infrastructure; the driver is not an alternative ORM. PostgreSQL deployment and
version, exact dependency/runtime pins, detailed contracts and implementation
scope still require the later packet. [ARCHITECTURE](ARCHITECTURE.md#ddd-and-onion-architecture),
[CODE-STANDARDS](CODE-STANDARDS.md#api-architecture) and the
[authentication design](specs/2026-10-28-authentication-design.md) define the
layer placement. D015's sign-in methods and official-only constraint remain in
effect. This decision authorizes documentation correction, not product scaffolding,
dependency installation, provider configuration, deployment or distribution.

## D017: Authentication design approval and PostgreSQL

Owner: product owner, 28 October 2026. The owner approves the revised
[authentication design](specs/2026-10-28-authentication-design.md) as delivered in
[PR #22](https://github.com/GloupsApp/gloups-health/pull/22), revision
`0b55294aa375078fc43550d66647e220896e9eb0`, and requests its implementation plan
with NestJS/Fastify, Drizzle ORM/PostgreSQL, DDD/Onion and official Better Auth/Expo
integrations. The documented authentication behavior/defaults are approved;
items the design explicitly leaves to planning, provider inventory or retention
review remain those later decisions. PostgreSQL is selected, superseding its
earlier proposed-only status; hosting/provider purchase is not selected here.

[AUTH-002](tasks/AUTH-002-authentication-plan.md) owns planning. The plan must
define exact future files, interfaces, versions, migration/deletion boundaries,
real HTTP/native acceptance and execution prerequisites. This is approval to
write the plan, not permission to execute it, configure providers, deploy,
distribute, message people or discard source data. Before product code, record
the reviewed implementation packet/owner on main under AGENT-WORKFLOW.

## D018: Native execution and owner PR review

Owner: product owner, 28 October 2026. The owner selects native execution of the
approved authentication plan and requires PRs for review before merge. The
authentication worker may commit, push and create/update PRs, but must not merge
them or enable auto-merge. This applies to assignment and feature PRs in this
work and supersedes the earlier automatic-integration instruction for them.

[AUTH-003](tasks/AUTH-003-authentication-implementation.md) records one owner,
worktree, exact planned files and acceptance. The main-assignment rule in
AGENT-WORKFLOW remains in effect: owner review/merge precedes source work unless
the owner explicitly changes that prerequisite. No new design/stack approval is
needed. No provider setup, deployment, distribution or external messages are
authorized by this execution choice. No agent-written unit tests or TDD.
