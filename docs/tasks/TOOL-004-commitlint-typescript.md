# TOOL-004: TypeScript commitlint configuration

Status: Assigned. Owner and integration coordinator: Codex, current commitlint
TypeScript chat. The owner's 28 October 2026 request approves replacing
`commitlint.config.mjs` with `commitlint.config.ts`.

## Intent and inputs

Use TypeScript for the root commitlint configuration. Keep the existing
`@commitlint/config-conventional` preset and verify discovery through the real
commit-message hook. The root TypeScript project already includes `*.ts`.

## Ownership

Repository: `/Users/maximebourmaud/Personal/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Base: `a77bfd540cc510dac85cdd7857330038fecf31aa`.
Assignment branch: `codex/tool-004-assignment`.
Implementation branch: `codex/tool-004-commitlint-typescript`, based on the merged
assignment. Worktree:
`/Users/maximebourmaud/.codex/worktrees/commitlint-typescript/gloups-health`.
One worker; no servers, devices or databases are reserved.

Allowed paths: root `commitlint.config.mjs`, `commitlint.config.ts`,
`docs/tasks/README.md`, this packet, `docs/verification/README.md` and
`docs/verification/2026-10-28-commitlint-typescript.md`.

Consumed interfaces: installed commitlint 21.2.4, Husky's commit-message hook and
the strict root TypeScript project. Produced interface: an automatically loaded
TypeScript config with the existing commit rules. No dependencies or application
code need to change. Read back the assignment merged on main before implementation.

## Acceptance

- Commitlint discovers `commitlint.config.ts`; the `.mjs` config is absent.
- The root compiler includes the TypeScript config under its strict settings.
- The actual commit-message hook accepts a Conventional Commit and rejects an
  invalid message using temporary synthetic inputs.
- With Bun 1.4.4, verify a frozen install, Ultracite fix/check/doctor, typechecking,
  the current build graph/build and Changesets status.
- Review the actual diff, local links, status/scope consistency and secret/data
  exclusions. Run `git diff --check`. No unit tests or TDD.
- Commit, push and merge the PR after local evidence. Record the commit/PR,
  results and resource cleanup here. GitHub Actions usage is exhausted.

## Handoff

Implementation begins after the assignment is merged and read back from main.
Deployment and distribution are outside this task.
