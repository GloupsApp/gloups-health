# TOOL-001: Workspace tooling and Blume documentation

Status: Done on merge of [PR #6](https://github.com/GloupsApp/gloups-health/pull/6);
Review until then. Initial setup
merged in [PR #5](https://github.com/GloupsApp/gloups-health/pull/5).
Owner and integration coordinator: Codex chat
`01a18275-5307-7d93-98f7-10ca191559f3`. The owner approved implementation in the
28 October 2026 request to add the named tools and Conventional Commit hooks.
This packet authorizes repository tooling and a minimal Blume documentation site.

## Intent and inputs

Use Bun workspaces and Turborepo, replacing the earlier Nx convention. Pin the
latest stable tool versions available at setup and commit one root `bun.lock`.
Use Ultracite with Oxlint, Oxfmt and anti-slop. Configure Husky pre-commit checks
and commit-msg validation with commitlint's Conventional Commits preset.
Changesets manages future package version records; this task publishes nothing.

The preceding folder-only work is merged in [PR #3](https://github.com/GloupsApp/gloups-health/pull/3).
[D011 and D012](../DECISIONS.md) record the owner's tooling choices and the Blume
placement. API/mobile implementation, product contracts and the main web framework
remain outside this approval.

Initial setup versions verified against the npm registry on 28 October 2026: Bun 1.4.4,
Turborepo 2.11.10, Oxlint 1.90.0, Oxfmt 0.75.0, Ultracite 8.1.0, Blume 2.2.6,
Changesets CLI 3.0.3, Husky 9.1.7, commitlint CLI/config-conventional 21.2.4,
lint-staged 17.6.0 and eslint-plugin-anti-slop 0.5.0. Check actual package exports,
engine requirements and installed help before configuring them.

References: [Bun release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.4),
[Turborepo](https://turborepo.dev/docs/getting-started/add-to-existing-repository),
[Ultracite](https://www.ultracite.ai/llms.txt), [Blume](https://useblume.dev/llms.txt),
[Husky](https://typicode.github.io/husky/get-started.html) and
[commitlint](https://commitlint.js.org/guides/local-setup.html).

## Ownership

Repository: `/Users/maximebourmaud/Personal/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Base: `303eb06647b4f10b21be60fef4a7435642f9e3cd` (folder reservation).
Assignment branch: `codex/tool-001-assignment`.
Implementation branch: `codex/tool-001-workspace-tooling`, based on the merged
assignment. One worker uses the primary checkout; no concurrent workers or shared
device/database resources are allocated.

Allowed paths: root `package.json`, `bun.lock`, `.bun-version`, `turbo.json`,
`oxlint.config.ts`, `oxfmt.config.ts`, `commitlint.config.mjs`, `.gitignore`,
`.husky/**`, `.changeset/**`, `apps/docs/**`, `AGENTS.md`, `CONTRIBUTING.md`,
`README.md`, `ROADMAP.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`,
`docs/CODE-STANDARDS.md`, `docs/VERIFICATION.md`, `docs/RELEASING.md`,
`docs/DECISIONS.md`, `docs/README.md`, `docs/tasks/README.md`,
`docs/tasks/FND-001-foundation.md`, `docs/verification/README.md`, this packet and a
dated tooling verification record. Formatting other existing Markdown is allowed
only if the initial formatter baseline requires it; keep content unchanged.

No source imports, other application/package manifests, providers, product UI,
unit tests, GitHub Actions, deployment or distribution. Preserve all existing
placeholders and ignored user state except placeholders replaced by real files.

Produced interfaces: reproducible workspace installation, real root scripts and
Turborepo tasks, Blume dev/build commands, staged-file checks, Conventional Commit
validation and local Changesets commands. No product interfaces are consumed.

## Acceptance

- Install with the pinned Bun release and verify `bun install --frozen-lockfile`.
- Exercise actual Turborepo task discovery, documentation build and cache reuse.
- Run `bunx ultracite fix`, `bunx ultracite check` and `bunx ultracite doctor`.
  Confirm anti-slop rules load; verify the supported source/config files.
- Exercise Husky pre-commit against staged files and commit-msg with both a valid
  Conventional Commit and an invalid message. Confirm hook installation after a
  normal install. No unit tests or TDD.
- Verify Changesets discovers the private documentation workspace and reports
  status without publishing or creating a release.
- Check the actual diff, local Markdown links/anchors, instruction/status
  consistency and secret/reference exclusions. Record commands and limitations.
- Commit, push and merge a PR after local checks. No CI run is required.

## Handoff

Assignment merged in [PR #4](https://github.com/GloupsApp/gloups-health/pull/4)
at `473452055e55dcd2aa3d1084e58b5d7dfde87ab3` and read back before implementation.
Implementation commit:
[0c6a811](https://github.com/GloupsApp/gloups-health/commit/0c6a8117c82217c7914226d465e6aaf5cdadc8c4).
Integration: [PR #5](https://github.com/GloupsApp/gloups-health/pull/5), including
this final handoff. Its merge commit is the integrated main revision.

The workspace, Blume site, Changesets configuration and hooks are implemented.
Local installation, formatting/lint diagnostics, build/cache checks, HTTP checks
and commit-message rejection are recorded in the
[tooling verification](../verification/2026-10-28-workspace-tooling.md).
The pre-commit hook completed against all 37 staged files it matched. No unit
tests, application scaffolds or provider resources were created. Dev and preview
servers on 127.0.0.1 ports 43217/43218 have been stopped.

The actual implementation commit ran pre-commit on 39 matched staged files and
passed commitlint. The latest-version manifests, lockfile and contributor commands
are the accepted tooling interface. Changesets has one pending private docs patch;
no version, tagging or publishing operation was performed.

Product web framework, API/mobile scaffolding, shared domain contracts and
provider decisions remain with their separately approved packets. Future workers
can use the tooling now, but domain specification assignments still authorize
specifications only. No shared server, database or simulator remains allocated.

## Anti-slop and terminal UI follow-up, 28 October 2026

The owner requested Ultracite's bundled anti-slop plugin and Turborepo's `tui` UI.
The existing owner and allowed paths cover this correction. Branch:
`codex/tool-001-ultracite-anti-slop-tui`; base:
`c3863e6e6ee03b3b422871dc160f8f3effa7a854`. The primary checkout is clean at
assignment; no other worker or shared resource is involved.

Extend `ultracite/oxlint/anti-slop` after core, remove the separate plugin
dependency and update the root lockfile. Set `"ui": "tui"` in `turbo.json`.
Verify a frozen install, Ultracite fix/check/doctor, a rejection from a bundled
anti-slop rule, the actual Turborepo graph/build and an interactive TUI run.
Check the diff and local links, then commit/push/merge and record the handoff.

The correction extends `ultracite/oxlint/anti-slop` after core and removes
`eslint-plugin-anti-slop` from both manifest and lockfile. No package version was
added or upgraded in the lockfile; 70 unused resolved versions were removed.
Turborepo now has `"ui": "tui"`.

The frozen install, Ultracite fix/check and all eight doctor diagnostics passed.
The bundled plugin rejected a temporary input with `anti-slop(no-reflect-get)`.
Task discovery and the Blume build passed; a terminal run with `--ui=tui`
displayed task panels and replayed the cached successful build. Details are in
the [verification follow-up](../verification/2026-10-28-workspace-tooling.md#anti-slop-and-terminal-ui-follow-up).
No persistent server or other shared resource was started.

Correction commit:
[033e75b](https://github.com/GloupsApp/gloups-health/commit/033e75b36bc39271564b5315fd997bddc9c2c597).
Integration: [PR #6](https://github.com/GloupsApp/gloups-health/pull/6), including
this handoff. The commit passed both Husky hooks, with eight staged files checked.
Local link/anchor checks passed for 178 references across 47 Markdown files.
The remaining product decisions and downstream boundaries above still apply.
