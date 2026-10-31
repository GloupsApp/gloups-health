# Gloups agent instructions

## Shared rules

- Use Node `26.12.1` and Bun `1.4.4`; Bun workspaces and Turbo own the package graph. Use the root `package.json` scripts and preserve the frozen lockfile workflow.
- Read [README.md](README.md) for local setup and architecture, and [.github/workflows/ci.yml](.github/workflows/ci.yml) for CI gates. Keep operational details there instead of duplicating them in instruction files.
- Preserve strict TypeScript, public workspace exports, and `workspace:*` dependencies. Change generated artifacts through their generator.
- Keep secrets, session credentials, health records, and signing material out of source, logs, and handoffs. Tests use synthetic identities and data.
- Preserve unrelated work. Do not reset another agent's changes. Use the `codex/` prefix when creating a branch.
- Publishing, deploying, and changing external services require authorization in the current task.

## Scope instructions

Read the applicable files before inspecting or changing a scope, even when working from the repository root. Read parent and child instructions together; do not load unrelated scopes.

- [API](apps/api/AGENTS.md)
- [Docs](apps/docs/AGENTS.md)
- [Mobile](apps/mobile/AGENTS.md)
- [Web](apps/web/AGENTS.md)
- [Shared packages](packages/AGENTS.md), plus [contracts](packages/contracts/AGENTS.md) or [UI](packages/ui/AGENTS.md) when applicable
- [Acceptance tests](e2e/AGENTS.md)

## Instruction precedence

- System, developer, and direct task instructions take precedence over repository files.
- The nearest scope file controls local code conventions. Shared secret and data protections apply in every scope.
- An assigned role narrows permitted actions; a scope's validation command does not require a planner or reviewer to execute it. Roles do not replace code conventions or grant permissions.
- Keep task state, assignments, and temporary decisions in delegation messages or ignored `.local/` notes, never in `AGENTS.md`.

## Collaboration and validation

- Use one agent for small tasks. Delegate independent work when the task and runtime allow it, following [.codex/README.md](.codex/README.md).
- Assign one writer per file, including generators and their outputs. Resolve ownership before editing overlapping files.
- Assign one owner to each validation command. Reuse results for the same file state; rerun after relevant changes, failures, or incomplete evidence.
- Use focused checks while implementing. The validation owner selects remaining gates from the affected scopes and CI; do not repeat a full suite in every role.
- Report changed files, exact checks and outcomes, and blockers. Distinguish checks that passed, failed, or were not run.
