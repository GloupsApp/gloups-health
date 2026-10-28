# AUTH-001: Official Better Auth authentication specification

Status: Done on merge of the architecture correction in
[PR #22](https://github.com/GloupsApp/gloups-health/pull/22); Review until then.
The initial specification was delivered in
[PR #20](https://github.com/GloupsApp/gloups-health/pull/20). Owner approval of the
remaining design was received on 28 October 2026 under D017. Implementation
planning proceeds in AUTH-002; product execution remains separately assigned.
Owner and integration coordinator: Codex, current authentication chat.

## Intent and inputs

The owner's 28 October 2026 request selects Better Auth in NestJS and Expo SDK 58,
using official integrations/plugins only. The owner separately confirms Google,
Apple and email/password as the initial sign-in methods. The community
`@thallesp/nestjs-better-auth` package is excluded. This supersedes the earlier
Clerk selection for new implementation; existing provider resources/data are
preserved until a separate transition is authorized.

The owner's follow-up on 28 October 2026 requires NestJS's official Fastify
adapter, Drizzle ORM and DDD with Onion architecture, following the supplied
[architecture reference](https://medium.com/@patrick.cunha336/structuring-a-nestjs-project-with-ddd-and-onion-architecture-65b04b7f2754).
Correct the earlier Express/direct-database proposal and record these as owner
decisions. Keep the confirmed authentication methods and official-only boundary.

Read root [AGENTS](../../AGENTS.md), [PRODUCT](../PRODUCT.md),
[DECISIONS](../DECISIONS.md), [ARCHITECTURE](../ARCHITECTURE.md),
[CONTRACTS](../CONTRACTS.md), [I18N](../I18N.md), [DESIGN](../DESIGN.md),
[VERIFICATION](../VERIFICATION.md), [AGENT-WORKFLOW](../AGENT-WORKFLOW.md) and
[FND-001](FND-001-foundation.md). Use version-matched official Better Auth,
NestJS and Expo documentation. The supplied Expo excerpt is 1.8 beta;
research stable package versions independently before proposing pins.

## Ownership

Repository/worktree:
`/Users/maximebourmaud/.codex/worktrees/015e/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Initial base: `b309d6cba41cc4ee18bba00c6812b2a3935e28a3`.
Assignment branch: `codex/auth-001-assignment`.
Specification branch: `codex/auth-001-official-better-auth`, created from the
merged assignment. Read back that assignment on `origin/main` before starting.
Correction assignment branch: `codex/auth-001-architecture-assignment`.
Correction branch: `codex/auth-001-fastify-drizzle-onion`, created from the
merged amendment. Read back the amendment on `origin/main` before revision work.
One worker; no API/database, Metro, port or device resources are reserved.

Allowed paths:

- `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`,
  `docs/DECISIONS.md`, `docs/SERVICES.md` and `docs/README.md` for the owner's
  confirmed identity decision and specification links.
- `docs/specs/2026-10-27-unified-health-coach-design.md` to reconcile the
  superseded identity direction while retaining source-history context.
- `docs/specs/2026-10-28-authentication-design.md` and `docs/specs/README.md`.
- This packet, `docs/tasks/README.md`,
  `docs/verification/2026-10-28-authentication-design.md` and
  `docs/verification/README.md`.
- `apps/api/AGENTS.md` and `docs/CODE-STANDARDS.md` for the confirmed API
  adapter, ORM and inward dependency rules; no application source is authorized.

Consumed interfaces: existing mobile shell/runtime, account ownership and
international requirements. Produced interfaces: a documented proposal for auth
HTTP mounting, session transport, Gloups account mapping, provider/email flows,
security/lifecycle behavior and real-boundary acceptance. FND-001 remains
unassigned and retains the broader common-contract responsibility.

No source, manifests, dependencies, lockfile, migrations, provider configuration,
UI flow or other worker packet may change. No user data/provider resource may be
deleted. This specification assignment is not an implementation packet.

## Acceptance

- Reconcile active Clerk instructions with the owner's Better Auth decision.
- Propose an official-only NestJS/Expo integration, reviewed stable versions and
  SDK 58 compatibility checks without claiming unperformed runtime verification.
- Use the official NestJS Fastify adapter and official Better Auth Fastify/Drizzle
  integration. Define DDD contexts, domain/application ports, infrastructure and
  HTTP composition boundaries. Keep framework/ORM/provider types outside the core.
  Cover raw JSON/form callback bodies, multiple cookies, migration ownership and
  transaction/account-isolation consequences in the revised acceptance.
- Cover Google, Apple and email/password, verification/recovery, session expiry
  and revocation, explicit linking, account isolation, deletion and failure paths.
- Identify database/driver, provider/email settings, native design references and
  exact implementation ownership/acceptance still needed before code begins.
- Distinguish confirmed decisions, proposed defaults and unresolved owner input.
- Review the actual diff, local Markdown targets/anchors, scope/status consistency
  and secret/reference exclusions; run `git diff --check` and relevant formatting.
- Use a builder review as required by the requested Superpowers design workflow.
  No agent-written/modified unit tests or TDD. No application/device check is
  claimed for documentation work.
- Commit, push and merge the documentation after local checks. Record the PR,
  exact evidence and remaining approval in the handoff. GitHub Actions is not a
  gate. Product implementation still requires approval of the specification and
  a separate implementation packet with exact paths and checks.

## Handoff

### Initial design delivery

Assignment merged in [PR #19](https://github.com/GloupsApp/gloups-health/pull/19)
at `73d48e473fb07704d38592f4b2225adba4ff169c`. The packet was read back from
`origin/main` at that revision before creating the specification branch.
The owner also selects native Apple on iOS, browser Google on both platforms and
browser Apple on Android. No product code, new dependency or provider resource
has changed. A frozen install of existing dependencies supplies the documentation
formatter/hooks.

The [authentication design](../specs/2026-10-28-authentication-design.md) proposes
official handler/client composition, candidate stable versions, account/session
boundaries, recovery/linking/deletion and real HTTP/native/provider acceptance.
Active guides/instructions now reflect D015; source history remains historical.
FND-001 and the other lanes were not reassigned or changed. No shared contract
package/type, source import, manifest, lockfile or migration changed.

A fresh Superpowers builder review, including a follow-up on Apple revocation
and deletion behavior, returned `nothing important left`. This is a planning
review, not behavioral acceptance or owner approval. Actual checks and limits are
in the [verification record](../verification/2026-10-28-authentication-design.md):
frozen Bun 1.4.4 install, formatting/checks, local Markdown targets/anchors,
owned-path/diff review, and the existing docs typecheck/build passed. The actual
Turborepo graph still contains only docs/mobile; no API task exists.

No server, port, database, simulator or physical device was allocated. Existing
provider resources/data and ignored user-owned state were preserved; dependency
and docs-build outputs remain ignored. No live email/provider/native check ran.

Next: owner approval of the design, followed by an exact implementation packet
and Superpowers plan. Runtime/database pins, native Apple exchange/cookie
propagation and deletion retention/re-registration must be settled in that
packet; email/provider inventory and Mobbin references precede the corresponding
live-provider/UI work. Auth product implementation remains unapproved and
unstarted.

Specification commit:
[2678c24](https://github.com/GloupsApp/gloups-health/commit/2678c2480e29a39303c8fb91ca204c83ae19a354).
Integration: [PR #20](https://github.com/GloupsApp/gloups-health/pull/20), including
this handoff. The merge revision is the integrated main record. Husky's staged
formatting and Conventional Commit hooks passed on the specification commit.
The existing worktree remains attached with the design available for review.

### Architecture correction

The same owner/worktree is assigned this documentation correction. The amendment
merged in [PR #21](https://github.com/GloupsApp/gloups-health/pull/21) at
`87a3861796848be73e8a4e98d7cf3caeb10e1660`; the packet was read back from
`origin/main` before creating `codex/auth-001-fastify-drizzle-onion` at that base.
The revised design and durable instructions now use official Fastify/Drizzle
integration and define domain/application ports, infrastructure/presentation
responsibilities and outer Nest composition. Original PR #20 evidence is retained
as historical delivery. Application code, dependencies, provider setup and native
work remain outside the packet. A fresh Superpowers builder reviewer read the
corrected design/API rules and reported `nothing important left`. Frozen Bun
installation, scoped formatting, repository Ultracite checks, local links/anchors
and diff/scope checks passed. The existing docs build/typecheck succeeded through
Turborepo cache hits; this is not new API, database or native acceptance.
The verification record includes the correction's sources and exact checks.
No new resources were allocated. The detailed design remains pending owner approval.

Correction commit:
[abfd2ff](https://github.com/GloupsApp/gloups-health/commit/abfd2ff35346955965a86f64b18379081a13adf3).
Integration: [PR #22](https://github.com/GloupsApp/gloups-health/pull/22), including
this handoff; its merge revision is the corrected main delivery record. Staged
formatting and Conventional Commit hooks passed. The worktree and revised design
remain available for review; no implementation plan or product code was added.

### Owner design approval

On 28 October 2026 the owner approved the revised design delivered at PR #22,
revision `0b55294aa375078fc43550d66647e220896e9eb0`, explicitly selected PostgreSQL,
and requested the implementation plan. D017 records this approval.
[AUTH-002](AUTH-002-authentication-plan.md) owns the
[plan](../plans/2026-10-28-authentication-implementation.md). Earlier handoff
statements about pending design approval describe those earlier delivery stages;
the design approval must not be requested again. Execution is not started by
this planning request.
