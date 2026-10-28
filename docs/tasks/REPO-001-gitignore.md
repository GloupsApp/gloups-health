# REPO-001: Complete repository ignore rules

Status: Done on merge of [PR #18](https://github.com/GloupsApp/gloups-health/pull/18);
Review until then. Owner and integration coordinator: Codex, current gitignore
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

Assignment merged in [PR #17](https://github.com/GloupsApp/gloups-health/pull/17)
at `a454ce1634c7506883c6795e5b9b24577081e4df`. The assignment was read back from
`origin/main` before implementation at
`c6ca676e881e53424486d98283fe2b0c652088f3`, including the concurrent Git attributes
work. No other packet was changed.

The root ignore file now also covers Android/iOS archives, runtime/rotated logs,
tool and Metro caches, Windows metadata, editor swap/backup files and additional
native signing formats. Existing rules and the `.env.example` exception remain
in place. No dependency, source or contract changed.

Checks ran on macOS arm64, Node.js `26.12.1` and Bun `1.4.4` from
`/tmp/gloups-tooling-20261028/bun-1.4.4`, first on PATH:

- `bun install --frozen-lockfile` passed in this worktree and prepared Husky.
- `bunx ultracite fix .gitignore docs/tasks/README.md docs/tasks/REPO-001-gitignore.md`
  passed for the two supported Markdown files; `.gitignore` is not a supported
  formatter input.
- `bunx ultracite check` passed repository formatting and lint checks.
- Inline Python supplied synthetic names and tracked paths to
  `git -c core.excludesFile=/dev/null check-ignore --no-index -z --stdin`.
  All 147 expected artifact paths were ignored. All 184 retained paths, including
  all 176 tracked files, root/workspace `.env.example` paths and representative
  source files, stayed trackable. No fixture files were created.
- `git ls-files --cached --ignored --exclude-standard` returned no paths.
- Inline Python validated all 17 local Markdown targets in the two changed
  documents and confirmed that only the three allowed files changed.
- `git diff --check` passed. The actual diff, existing ignore-rule preservation,
  scope/status consistency and secret/reference exclusions were reviewed.

No unit tests, application builds or E2E/device checks were added or run for this
Git metadata change. No server, port, device or database was allocated. Ignored
user-owned state was preserved. The assignment and implementation use this
existing worktree, with only generated dependencies added locally. No application
decisions or downstream dependencies remain; deployment is outside this task.

Implementation:
[74cdc21](https://github.com/GloupsApp/gloups-health/commit/74cdc21527cf8f6186d5bfc5afc7ac7519251847).
Integration: [PR #18](https://github.com/GloupsApp/gloups-health/pull/18), including
this handoff. Its merge commit is the integrated main revision. The implementation
commit passed Husky's staged-file formatting and Conventional Commit hooks.
