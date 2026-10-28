# AUTH-002: Approved authentication implementation plan

Status: Assigned for planning; work starts after this assignment merges.
Owner and integration coordinator: Codex, current authentication chat.

## Intent and inputs

On 28 October 2026 the owner approves the
[authentication design](../specs/2026-10-28-authentication-design.md) as delivered
in [PR #22](https://github.com/GloupsApp/gloups-health/pull/22), revision
`0b55294aa375078fc43550d66647e220896e9eb0`, and asks for its implementation plan.
The owner explicitly confirms PostgreSQL with NestJS/Fastify, Drizzle ORM,
DDD/Onion and official Better Auth/Expo integrations. Google, Apple,
email/password and the selected native/browser split remain approved.

Produce a concrete plan; do not implement it. Record the approved design/revision
and distinguish this planning assignment from permission to create product code,
install new dependencies, configure providers, deploy or distribute.

## Ownership

Repository/worktree:
`/Users/maximebourmaud/.codex/worktrees/015e/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Initial base: `0b55294aa375078fc43550d66647e220896e9eb0`.
Assignment branch: `codex/auth-002-plan-assignment`.
Planning branch: `codex/auth-002-authentication-plan`, created from the merged
assignment after reading it back on `origin/main`. One owner; no service, database,
port, Metro, simulator or device is allocated for planning.

Allowed paths:

- This packet, `docs/tasks/README.md` and the approval/handoff status in
  `docs/tasks/AUTH-001-better-auth.md`.
- `docs/plans/2026-10-28-authentication-implementation.md` and `docs/plans/README.md`.
- `docs/DECISIONS.md`, `docs/specs/2026-10-28-authentication-design.md`,
  `docs/specs/README.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`,
  `apps/api/AGENTS.md` and `docs/README.md` for the owner's approval/PostgreSQL
  decision, plan links and consistent status; no unrelated redesign.
- `docs/verification/2026-10-28-authentication-plan.md` and
  `docs/verification/README.md`.

Consumed interface: the approved AUTH-001 design at the revision above and the
repository's architecture, strict TypeScript, workspace and acceptance policies.
Produced interface: sequential implementation tasks with exact future files,
ports/signatures, dependencies/versions, planned commands, E2E Army cases,
stage dependencies and handoff. Other foundation/health packets remain unassigned
and retain their broader contract ownership. No source/manifests/lockfile,
migrations, provider configuration or UI flow may be changed in this assignment.

## Acceptance

- Record design approval and PostgreSQL selection without reopening settled
  architecture or inferring implementation authorization.
- Plan official NestJS Fastify, Better Auth Drizzle/Expo and native Apple/browser
  flows, with inward domain/application dependencies and concrete migration,
  transaction, session, email, linking and deletion boundaries.
- Include reviewed stable dependency/runtime targets, exact prospective owned
  paths and scripts, dependency order and scope/resource ownership for execution.
- Cover the complete approved spec with real HTTP/PostgreSQL and native/provider
  acceptance; no agent-written/modified unit tests or TDD. Distinguish existing
  commands/checks from future commands/artifacts the plan introduces.
- Identify stage prerequisites, including provider/email authorization, Mobbin
  references, E2E Army connection, actual device resources and retention policy,
  without inventing evidence or blocking independent plan authoring.
- Use the Superpowers writing-plans self-review for coverage, interfaces, review
  focus and proportion; no subagent implementation or product work is assigned.
- Check actual diff, local links/anchors, scope/status consistency and
  secret/reference exclusions, format relevant documentation, then commit, push
  and merge. No reliance on Actions; record exact local evidence and limitations.

## Handoff

Assignment pending merge. The owner has approved the design and requested planning
only. No plan, implementation, provider change or resource allocation has started.
Record assignment/plan PRs, actual checks, self-review and execution prerequisites
before handoff. Plan review/execution assignment is the next step, not deployment.
