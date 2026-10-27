# Contributing to Gloups

Start with [AGENTS](AGENTS.md), [PRODUCT](docs/PRODUCT.md) and
[ROADMAP](ROADMAP.md). The repository is private and currently documentation only.

## First checkout

```sh
git clone git@github.com:GloupsApp/gloups-health.git
cd gloups-health
git status --short --branch
git remote get-url origin
```

Read [DECISIONS](docs/DECISIONS.md), then take a coordinator-assigned
[task packet](docs/tasks/README.md). Use its branch, worktree and allowed paths.
A fresh clone needs Git and authorized repository access to work on these docs.
It does not need Node, Bun, Docker, Xcode or an app/provider login yet.

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

No application build, lint, typecheck or E2E target exists yet. Do not report them
as passing. The first approved tooling packet must define real Nx targets and
update this guide with commands that were exercised successfully.

## Future application work

Bun 1.4.2, a single root bun.lock, Nx and Ultracite/Oxlint/Oxfmt are the selected
repository conventions. The compatibility review must pin runtime/framework
versions before scaffolding. Once a real lockfile exists, use
`bun install --frozen-lockfile`; inspect resolved Nx targets before running them.
There is no reason to run that install in today's documentation checkout.

Agents do not add or change unit tests and do not use TDD. Verify behavior with
E2E Army over real service/device boundaries as described in
[VERIFICATION](docs/VERIFICATION.md). Follow the scoped application instructions.

## Pull requests and handoff

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

## Documentation placement

Root files introduce the product and contributor rules. Durable technical guides
live directly under docs. Specifications, implementation plans, contracts,
work packets and dated evidence have separate directories linked from
[docs/README](docs/README.md). Keep guides current and evidence dated. Preserve
incoming links when moving files. The root AGENTS is the single policy source;
CLAUDE imports it and scoped AGENTS files add only application-specific rules.
