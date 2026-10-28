# REPO-001: Complete repository ignore rules

Status: Assigned. Owner and integration coordinator: Codex, current gitignore
chat. The owner's 28 October 2026 request authorizes adding repository ignore
rules. A root `.gitignore` already exists; extend it for missing local artifacts.

## Intent and inputs

Keep dependencies, generated output, local state and secrets outside Git for the
existing Bun/Turborepo, Blume and Expo workspaces. Preserve the current rules and
keep source, manifests, the root lockfile and `.env.example` trackable.

## Ownership

Repository/worktree:
`/Users/maximebourmaud/.codex/worktrees/d92c/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Base: `c9838134616b6f6eea7ec60101d5fc53ca21c515`.
Assignment branch: `codex/repo-001-gitignore-assignment`.
Implementation branch: `codex/repo-001-gitignore`, based on the merged assignment.
One worker; no servers, ports, devices or databases are reserved.

Allowed paths: root `.gitignore`, `docs/tasks/README.md` and this packet.
Consumed interface: Git ignore-pattern semantics and current workspace paths.
Produced interface: root ignore rules covering logs, tool caches, editor files,
native build artifacts and signing material. No source, dependencies, contracts
or other worker packets may change. Read back the assignment merged on main
before implementation.

## Acceptance

- Preserve existing dependency, build, local-state, environment and database rules.
- Cover missing runtime logs, caches, editor files and native/signing artifacts
  at the root and nested workspace paths where appropriate.
- Use `git check-ignore` with synthetic path names to verify ignored artifacts
  and retained source, manifests, the lockfile and environment examples.
- Confirm no tracked files match ignore rules with
  `git ls-files --cached --ignored --exclude-standard`.
- Use Bun 1.4.4 for a frozen install and relevant Ultracite formatting/checks.
  Review the actual diff, local Markdown links, scope/status consistency and
  secret/reference exclusions; run `git diff --check`. No unit tests or TDD.
- Commit, push and merge after local evidence; record exact checks and commit/PR
  links here. GitHub Actions usage is exhausted. Preserve ignored user state.

## Handoff

Assignment only. Implementation and verification follow its merge on main.
This maintenance task introduces no application behavior or deployment.
