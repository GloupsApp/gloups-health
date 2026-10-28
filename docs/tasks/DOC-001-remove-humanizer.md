# DOC-001: Remove the local Humanizer skill

Status: Review. Owner and integration coordinator: Codex, current skill-removal
chat. The owner's 28 October 2026 request approves removing the repository's
Humanizer skill and updating references that depend on it.

## Intent and inputs

Remove the three tracked files under `.agents/skills/humanizer`. Remove the
instruction to use that skill, current documentation claims about its presence
and the lint/formatter exclusions for the removed directory. Preserve dated
verification records as evidence of earlier repository states.

## Ownership

Repository and worktree: `/Users/maximebourmaud/Personal/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Base: `a77bfd540cc510dac85cdd7857330038fecf31aa`.
Assignment branch: `codex/docs-001-assignment`.
Implementation branch: `codex/docs-001-remove-humanizer`, based on the merged
assignment. One worker; no servers, devices or databases are reserved.

Allowed paths: `.agents/skills/humanizer/LICENSE`,
`.agents/skills/humanizer/SKILL.md`, `.agents/skills/humanizer/UPSTREAM.md`,
`AGENTS.md`, `CONTRIBUTING.md`, `docs/MIGRATION.md`, `oxfmt.config.ts`,
`oxlint.config.ts`, `docs/tasks/README.md` and this packet.

Consumed interfaces: existing contributor instructions and Ultracite
configuration. Produced interfaces: contributor instructions and tooling that
do not depend on the removed local skill. No product code, dependency or
contract change is approved. Read back the assignment merged on main before
implementation.

## Acceptance

- All three tracked skill files are removed.
- Active instructions, current documentation and tooling have no dependency on
  the removed skill. Historical verification records retain their original facts.
- Review the actual diff, Markdown targets/anchors, scope/status consistency and
  secret/reference exclusions. Run `git diff --check`.
- With the pinned Bun version, run Ultracite fix/check/doctor, typechecking,
  the existing build and Changesets status. No unit tests or TDD.
- Commit, push and merge the implementation PR after local checks. Record the
  commit/PR links, results and limitations here. GitHub Actions are unavailable.

## Handoff

Assignment merged in [PR #11](https://github.com/GloupsApp/gloups-health/pull/11)
at `e067e6f7d0c58037f4a30456bea1af8a8f2c3f70`. The assigned scope was read back
from `origin/main` before creating the implementation branch at that revision.

The skill files, active usage instruction, current documentation references and
directory-specific lint/formatter exclusions are removed. Dated verification
records are unchanged.

Checks ran on macOS arm64 with Node.js `26.12.1` and Bun `1.4.4` from
`/tmp/gloups-tooling-20261028/bun-1.4.4`, first on PATH:

- `bunx ultracite fix AGENTS.md CONTRIBUTING.md docs/MIGRATION.md oxfmt.config.ts oxlint.config.ts docs/tasks/README.md docs/tasks/DOC-001-remove-humanizer.md`
  passed on the seven retained changed files.
- `bunx ultracite check` passed, including formatting and linting.
- `bunx ultracite doctor` passed all eight diagnostics without warnings.
- `bun run turbo run build --dry=json` confirmed the existing docs/mobile build
  graph and each workspace's typecheck dependency.
- `bun run typecheck` and `bun run build` passed. The root tooling compiler ran;
  workspace typechecks/builds used existing local Turborepo cache entries. Those
  entries are reused results, with no new app-build or device evidence claimed.
- `bun run changeset:status` passed and reported the existing docs patch release.
  This task adds no dependency or version change.
- `python3 /tmp/gloups-strict-typescript-check-docs.py` passed all 206 local
  Markdown targets/anchors across 56 Markdown files.
- `git diff --check` passed. The actual diff and an inline Python inventory check
  confirmed the ten allowed changed paths, absence of the skill directory, no
  active references, unchanged dated evidence and no matching secret patterns
  in additions. Prose, task status and reference exclusions were reviewed.

No unit tests or E2E/device checks were added or run for this removal. No server,
device, database or additional worktree was allocated. Implementation integration
and its commit/PR links remain to be recorded.
