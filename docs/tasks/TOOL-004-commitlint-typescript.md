# TOOL-004: TypeScript commitlint configuration

Status: Done on merge of [PR #14](https://github.com/GloupsApp/gloups-health/pull/14);
Review until then. Owner and integration coordinator: Codex, current commitlint
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

Assignment merged in [PR #12](https://github.com/GloupsApp/gloups-health/pull/12)
at `f91c1dfa3553bb2a3652d0ad9346ab4b3fb01d5a`. The packet and registry were read
back from `origin/main` before creating the implementation branch at that revision.

The config is now `commitlint.config.ts`, with identical contents. Commitlint's
installed loader discovers that file and the conventional preset. The root
compiler includes it through the existing `*.ts` scope. Dependencies, compiler
settings and the commit hook need no changes.

Bun 1.4.4 frozen installation, Ultracite fix/check/doctor, root typechecking,
build graph discovery, the root build and Changesets status passed. Turbo reused
the unchanged docs/mobile typecheck and build tasks from its shared local cache;
the root compiler ran directly. The actual Husky commit-message hook returned
0 for a valid synthetic message and 1 for an invalid one. Temporary inputs were
removed. Exact commands and limitations are in the
[verification record](../verification/2026-10-28-commitlint-typescript.md).

Implementation:
[b25cf74](https://github.com/GloupsApp/gloups-health/commit/b25cf74735fdaaf37fa528755df4c22d2418453a).
Integration: [PR #14](https://github.com/GloupsApp/gloups-health/pull/14), including
this handoff. Its merge commit is the integrated main revision. The latest main
revision `c011fbb0c3907c72b7db5a32f851a97296f82638` was integrated before review;
Ultracite fix/check/doctor and typechecking passed again. The implementation and
integration commits passed both Husky hooks using the TypeScript config.

No server, database or device was allocated. The task worktree contains only its
committed changes and generated dependencies/build output and can be archived
after merge. Deployment and distribution remain outside this task.
