# TypeScript commitlint verification, 28 October 2026

Scope: [TOOL-004](../tasks/TOOL-004-commitlint-typescript.md), based on assignment
merge `f91c1dfa3553bb2a3652d0ad9346ab4b3fb01d5a`. Implementation commit and PR
links live in the packet.

Checks ran on macOS arm64 with Node.js 26.12.1 and Bun 1.4.4 from
`/tmp/gloups-tooling-20261028/bun-1.4.4`, first on PATH. The isolated worktree was
`/Users/maximebourmaud/.codex/worktrees/commitlint-typescript/gloups-health`.

## Results

| Command or boundary                                      | Observed result                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`                          | Passed; no manifest or lockfile change; Husky prepared                                      |
| `bunx ultracite fix`                                     | Passed; the config rename needed no content changes                                         |
| `bunx ultracite check`                                   | Passed                                                                                      |
| `bunx ultracite doctor`                                  | Eight checks passed, no warnings or failures                                                |
| `bun run tsc --project tsconfig.json --showConfig`       | Included `./commitlint.config.ts` with strict checks and `skipLibCheck: false`              |
| `bun run typecheck`                                      | Passed; root compiler ran directly, docs/mobile typechecks were cache hits                  |
| `bun run turbo run build --dry=json`                     | Docs/mobile builds each depend on their workspace typecheck                                 |
| `bun run build`                                          | Passed; root compiler ran directly, all four Turbo tasks were cache hits                    |
| `bun run changeset:status`                               | Passed; reported the existing docs patch Changeset                                          |
| Installed commitlint `loadConfig(process.cwd())`         | Discovered exactly `commitlint.config.ts`, extending only `@commitlint/config-conventional` |
| `sh .husky/_/commit-msg <temporary-file>`                | Valid message accepted with exit 0; invalid message rejected with exit 1                    |
| `git diff --check` and local Markdown link/anchor review | Passed                                                                                      |

The hook inputs were `chore: verify TypeScript commitlint config` and
`update configuration`. The invalid message reported `subject-empty` and
`type-empty`. Both checks invoked the installed Husky wrapper and unchanged
`commit-msg` script, which runs commitlint with Bun. Temporary files were removed
afterward. No unit tests were added or modified.

The actual diff renames `commitlint.config.mjs` to `commitlint.config.ts` with
identical contents and records this task's status/evidence. Historical tooling
records retain the original filename. Active scripts discover the config
automatically. No dependency, compiler-option or hook-script change was needed.
The diff was reviewed for scope, task status, secrets and excluded references.

## Limits and cleanup

Cached docs/mobile logs are earlier evidence reused by Turbo; they are not new
build or native-device acceptance. These checks cover repository tooling.
GitHub Actions usage is exhausted, and no CI run was awaited or claimed.
No server, device, database, provider connection or deployment was created.
Generated dependencies and restored build output stay ignored in the task
worktree, which can be archived after the PR merges.
