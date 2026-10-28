# AUTH-001: Official Better Auth authentication specification

Status: Assigned; specification work starts after this assignment merges.
Owner and integration coordinator: Codex, current authentication chat.

## Intent and inputs

The owner's 28 October 2026 request selects Better Auth in NestJS and Expo SDK 58,
using official integrations/plugins only. The owner separately confirms Google,
Apple and email/password as the initial sign-in methods. The community
`@thallesp/nestjs-better-auth` package is excluded. This supersedes the earlier
Clerk selection for new implementation; existing provider resources/data are
preserved until a separate transition is authorized.

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
- Cover Google, Apple and email/password, verification/recovery, session expiry
  and revocation, explicit linking, account isolation, deletion and failure paths.
- Identify database/ORM, provider/email settings, native design references and
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

Assignment pending merge. No specification edits, application work, dependency
installation or provider changes have started. Record the merged assignment,
specification commit/PR, actual checks, proposed interfaces, remaining decisions
and resource state here before handoff.
