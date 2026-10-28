# TOOL-001: Workspace tooling and Blume documentation

Status: Assigned. Owner and integration coordinator: Codex chat
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

Versions verified against the npm registry on 28 October 2026: Bun 1.4.4,
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
`docs/DECISIONS.md`, `docs/README.md`, `docs/tasks/README.md`, this packet and a
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

Assignment is ready for integration. Implementation starts after this assignment
is merged on main and read back. Record implementation base/final commit, PR,
actual versions/checks, remaining decisions and resource cleanup here.
