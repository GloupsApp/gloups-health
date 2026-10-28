# Workspace tooling verification, 28 October 2026

Scope: [TOOL-001](../tasks/TOOL-001-workspace-tooling.md), approved repository
tooling and a minimal local Blume documentation workspace. The assignment merged
in [PR #4](https://github.com/GloupsApp/gloups-health/pull/4), base revision
`473452055e55dcd2aa3d1084e58b5d7dfde87ab3`. Implementation branch:
`codex/tool-001-workspace-tooling`. The packet records the implementation commit
and merged PR at handoff.

## Versions and environment

Direct versions were checked against the npm registry's `latest` tags on
28 October 2026. Exact versions are in the manifests and root `bun.lock`.

| Tool                                   | Version |
| -------------------------------------- | ------- |
| Bun                                    | 1.4.4   |
| Turborepo                              | 2.11.10 |
| Oxlint                                 | 1.90.0  |
| Oxfmt                                  | 0.75.0  |
| Ultracite                              | 8.1.0   |
| Blume                                  | 2.2.6   |
| Changesets CLI                         | 3.0.3   |
| Husky                                  | 9.1.7   |
| commitlint CLI and config-conventional | 21.2.4  |
| lint-staged                            | 17.6.0  |
| eslint-plugin-anti-slop                | 0.5.0   |

Checks used macOS arm64, Node.js 26.12.1 and the official Bun 1.4.4 release
binary under `/tmp/gloups-tooling-20261028/bun-1.4.4`. Commands below had that
directory first on PATH. The user's global Bun installation was not changed.
The repository requires Node.js >=24.15.0 for the toolchain. Blume resolved
Astro 7.4.2 through its own dependency range; no product Astro app was created.

## Actual checks

- `git rev-parse --show-toplevel`, `git remote -v` and `git fetch origin` confirmed
  `/Users/maximebourmaud/Personal/gloups-health` and
  `git@github.com:GloupsApp/gloups-health.git`. The initial checkout was clean.
- `bun install` installed the workspace dependencies and ran `husky` through
  `prepare`. `bun install --frozen-lockfile` then passed with no dependency
  changes. `git config --get core.hooksPath` returned `.husky/_`.
  `bun pm untrusted` reported zero untrusted dependencies with scripts.
- `bunx ultracite fix` applied the initial formatting baseline. Existing planning
  tables and a few Markdown line wraps changed without changing their content.
  The vendored local skill and generated Blume/Astro/build output are excluded.
- `bunx ultracite check` passed. `bunx ultracite doctor` reported eight passed
  diagnostics, zero warnings and zero failures, including compatibility of
  Oxlint 1.90.0 and Oxfmt 0.75.0 with Ultracite 8.1.0.
- `bun run lint` passed. A temporary JSX input outside the repository containing
  placeholder copy was rejected by `bun run oxlint -c <root>/oxlint.config.ts
  <temporary-input>` with exit 1 and `anti-slop(no-placeholder-copy)`. This
  confirms the JS plugin executes; no probe source or unit test was committed.
- `bun run turbo run build --dry=json` discovered only `@gloups/docs#build`.
  `bun run build` built the Blume site into `apps/docs/dist` with static output
  and local Orama search. `bun run docs:build` subsequently reported a local cache
  hit. Remote caching was disabled. A site/deployment URL is intentionally unset.
- `bun run --cwd apps/docs blume doctor` found one content page, static output,
  filesystem content, local search, no assistant/analytics and no problems.
- `bun run docs:dev --host=127.0.0.1 --port=43217` served `/` and
  `/api/docs/pages.json` over real local HTTP with status 200. The rendered HTML
  contained the expected Gloups documentation text; the docs API returned JSON.
- `bun run docs:preview --host=127.0.0.1 --port=43218` served the built `/` page
  and `/blume-search.json` with status 200. The page contained the expected text
  and the search index returned JSON. Both task-owned servers were stopped.
- `.husky/_/pre-commit` ran lint-staged on 37 staged files, completed
  `ultracite fix`, staged its fixes and removed its temporary backup. Existing
  Git stashes were absent before/after; no user state was removed.
- `.husky/_/commit-msg <temporary-message-file>` accepted
  `chore: configure workspace tooling` with exit 0 and rejected
  `update workspace tooling` with exit 1 (`subject-empty` and `type-empty`).
  Temporary messages were removed.
- `bun run changeset init` confirmed the installed configuration. Changesets 3
  initialization prompts interactively, so the configuration was authored from
  its installed schema/defaults. `bun run changeset --patch @gloups/docs
  --message 'Set up the Gloups documentation workspace with Blume.'` created the
  first record. `bun run changeset:status` reported the pending private-package
  patch. No version command, tag or publish command was run.
- Local Markdown file/anchor checks passed using a temporary checker. The actual
  staged diff was reviewed for whitespace, scope, status/instruction consistency,
  generated files, credentials, health data and excluded references. The sole
  tracked dependency lockfile is the root `bun.lock`.

## Limits and downstream work

This is tooling and local documentation evidence. There is no product API,
mobile app, product web app, database, provider connection or product E2E run.
No unit tests or TDD were added. GitHub Actions was not used and no workflow was
added. No package was published and no site was deployed.

Future product work needs its approved implementation packets and real-boundary
acceptance. The product web framework remains open. The Blume site currently has
one introductory page; the repository's engineering guides remain under `docs`.
