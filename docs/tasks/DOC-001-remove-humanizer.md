# DOC-001: Remove the local Humanizer skill

Status: Assigned. Owner and integration coordinator: Codex, current skill-removal
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

Assignment is ready for integration. Implementation starts after its assignment
is merged and read back from main. No application behavior, provider setup,
deployment or distribution is part of this task.
