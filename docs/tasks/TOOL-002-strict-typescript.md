# TOOL-002: Strict TypeScript configuration

Status: Review. Owner and integration coordinator: Codex, current strict
TypeScript chat. The owner's 28 October 2026 request approves adding Blume's
base configuration and strengthening it for production application work.

## Intent and inputs

Start from the [Blume base configuration](https://github.com/haydenbleasel/blume/blob/main/tsconfig.base.json).
Enable the additional compiler checks appropriate for shared strict TypeScript,
including declaration checking. Make the current workspace consume the base and
provide a real compiler command. Document runtime-specific overrides for future
approved application packets.

This approval covers repository tooling and the existing documentation workspace.
Product scaffolding, provider connections and product architecture decisions
remain with their separate packets. Dependencies use reviewed, exact stable
versions and the root Bun lockfile.

## Ownership

Repository: `/Users/maximebourmaud/Personal/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Base: `ec18dcb976a0cd9fcba875312054389a1e446795`.
Assignment branch: `codex/tool-002-assignment`.
Implementation branch: `codex/tool-002-strict-typescript`, based on the merged
assignment. Worktree:
`/Users/maximebourmaud/.codex/worktrees/strict-typescript/gloups-health`.
One worker; no servers, devices or databases are reserved.

Allowed paths: root `tsconfig.base.json`, `tsconfig.json`, `package.json`,
`bun.lock`, `turbo.json`, `apps/docs/tsconfig.json`, `apps/docs/package.json`,
`apps/docs/blume.config.ts`, `oxlint.config.ts`, `oxfmt.config.ts`,
`CONTRIBUTING.md`, `docs/CODE-STANDARDS.md`, `docs/ARCHITECTURE.md`,
`docs/DECISIONS.md`, `docs/VERIFICATION.md`, `docs/tasks/README.md`, this packet,
`docs/verification/README.md`, a dated TypeScript verification record and an empty
Changeset for repository tooling.

Consumed interfaces: the installed Bun/Turborepo/Ultracite tooling and Blume
configuration API. Produced interfaces: an inherited strict compiler baseline,
an explicit current-workspace typecheck command and documented extension rules.
No other worker's packet, product application or shared domain contract is owned
by this task. Read back the assignment merged on main before implementation.

## Acceptance

- Compare every upstream option and explain any deliberate differences.
- Verify the effective compiler settings and the current included files.
- Run a real typecheck with declaration checking enabled. Keep framework or
  runtime requirements in the consuming project rather than weakening the base.
- Verify a frozen install, Ultracite fix/check/doctor, the real Turborepo build
  graph, the documentation build and Changesets status with Bun 1.4.4.
- Review the diff, local links, status/scope consistency and secret/reference
  exclusions. No unit tests or TDD; record exact local checks and limitations.
- Commit, push and merge a PR with a handoff. GitHub Actions, deployment and
  distribution are outside this task.

## Handoff

Assignment merged in [PR #7](https://github.com/GloupsApp/gloups-health/pull/7)
at `4f1df4c81768a704803ab0c6d6cc38cffa6498a6`. The assigned scope was read back
from `origin/main` before creating the implementation branch.

The shared base preserves Blume's settings and strengthens nine additional
checks, with declaration checking enabled. Root and docs projects inherit it;
`bun run typecheck` and both build entry points enforce the relevant compiler
checks. The root tooling configs handle optional preset arrays explicitly.

TypeScript 6.0.3 is the latest compatible stable compiler for the existing docs
dependencies. The docs project alone skips declaration diagnostics from its
dependencies, which produce 122 errors with declaration checking enabled. All
authored code remains strict. This documented docs exception does not permit a
future product application to weaken the shared baseline.

Frozen installation, Ultracite fix/check/doctor, effective compiler settings,
typechecking, Turborepo graph discovery, an uncached docs build and Changesets
status passed. The [verification record](../verification/2026-10-28-strict-typescript.md)
contains exact commands, scope and the declaration limitation. Git integration
and independent review are pending. No server, database or device was allocated.
