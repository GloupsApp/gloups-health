# Contributing to Gloups

Start with [AGENTS](AGENTS.md), [PRODUCT](docs/PRODUCT.md) and
[ROADMAP](ROADMAP.md). The repository is private. It has workspace tooling and a
local Blume documentation site; product application folders remain reserved.

## First checkout

```sh
git clone git@github.com:GloupsApp/gloups-health.git
cd gloups-health
git status --short --branch
git remote get-url origin
```

Read [DECISIONS](docs/DECISIONS.md), then take a coordinator-assigned
[task packet](docs/tasks/README.md). Use its branch, worktree and allowed paths.
A fresh clone needs Git, authorized repository access, Bun 1.4.4 and Node.js
24.15.0 or newer. Install from the root:

```sh
bun install --frozen-lockfile
```

The root `packageManager` field and `.bun-version` pin Bun. Installation prepares
Husky's hooks. Docker, Xcode and provider logins are unnecessary for this tooling
and documentation workspace.

## Current checks

For documentation and metadata changes:

1. Run `git diff --check` and inspect every changed file, including untracked files.
2. Check all local Markdown link targets and anchors. Planned paths are inline
   code, not links to files that do not exist.
3. Confirm instructions distinguish real commands/files from future ones.
4. Check confirmed decisions, proposed decisions and task status against their
   source. Review English/French meaning and date/region examples where affected.
5. Review for credentials, personal data, excluded health-app names and false
   implementation, compliance or release claims.
6. Record exact checks and limitations in the task or a dated verification record.

For tooling and supported source/config changes, run from the root:

```sh
bun run fix
bun run check
bunx ultracite doctor
bun run build
bun run changeset:status
```

`fix` and `check` use Ultracite's Oxlint/Oxfmt backend with anti-slop rules.
`bun run lint`, `bun run format` and `bun run format:check` expose the individual
tools. Generated Blume/Astro/build output and the vendored local skill are ignored
by the formatter. Existing planning Markdown follows the initial Oxfmt baseline.

`build` currently builds only `@gloups/docs`. Inspect the graph with
`bun run turbo run build --dry=json`; preview with `bun run docs:dev` or
`bun run docs:preview` after building. No product app, API, typecheck or E2E task
exists yet. Tooling and docs checks do not establish product behavior.

## Future application work

Use Bun workspaces, a single root `bun.lock`, Turborepo and
Ultracite/Oxlint/Oxfmt. Decision D011 replaces Nx. New direct dependencies must
use the latest stable version available at setup, pinned exactly after a
compatibility review. Update the manifest and lockfile together. A product
framework remains subject to its own approved implementation packet.

Agents do not add or change unit tests and do not use TDD. Verify behavior with
E2E Army over real service/device boundaries as described in
[VERIFICATION](docs/VERIFICATION.md). Follow the scoped application instructions.

## Pull requests and handoff

- Use Conventional Commits: `feat: add ...`, `fix: correct ...`,
  `docs: describe ...` or `chore: update ...`. Husky runs lint-staged with
  `ultracite fix` before each commit and commitlint in `commit-msg`. lint-staged
  preserves unstaged edits and stages its fixes. Use Conventional Commit PR
  titles so squash merges keep the same convention.
- Use `codex/<task-id>-<short-description>` branches and small, focused commits.
- Describe the final behavior or document change and the relevant local evidence.
  State what remains proposed or unverified.
- Push, create a PR against main and merge after relevant local checks. This
  workflow is authorized; GitHub Actions must not block on exhausted usage.
- Attach the created PR to the current Codex chat when the tool is available.
- Do not bundle dependency/contract changes from other lanes. The coordinator
  integrates shared changes and resolves conflicts with the relevant owners.
- Finish the packet's handoff: accepted interfaces, commit/PR, actual checks,
  open decisions, resource cleanup and the next dependent task.

Merging documentation does not approve a product design, deploy a service,
publish Canny cards, invite collaborators or distribute an app.

## Changesets

Run `bun run changeset` for a package change that needs a version record.
Use `bun run changeset --empty` for repository-only work if a release record is
useful. Inspect pending changes with `bun run changeset:status` and apply approved
version changes with `bun run version-packages`. The base branch is `main`.
Private packages can receive versions/changelogs, with tagging disabled.

The current documentation package is private. No publish script or release
workflow is configured. Package publication, deployment and store distribution
require their own authorization.

## Documentation placement

Root files introduce the product and contributor rules. Durable technical guides
live directly under docs. Specifications, implementation plans, contracts,
work packets and dated evidence have separate directories linked from
[docs/README](docs/README.md). Keep guides current and evidence dated. Preserve
incoming links when moving files. The root AGENTS is the single policy source;
CLAUDE imports it and scoped AGENTS files add only application-specific rules.
