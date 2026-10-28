# Working in Gloups

Read [PRODUCT](docs/PRODUCT.md), [ROADMAP](ROADMAP.md),
[CONTRIBUTING](CONTRIBUTING.md) and the [documentation index](docs/README.md).
These instructions apply to people and coding agents. Follow scoped AGENTS.md
files when entering their application or package.

## Current stage and authority

- This repository contains documentation, workspace tooling, a local Blume
  documentation site and a minimal Expo SDK 58 mobile shell. API and product web
  folders remain reservations. Product flows and provider connections are absent.
- Worldwide iOS/Android launch, French/English first, nutrition/fitness/sleep/
  optional cycle, explainable daily coaching and full workout recording are
  confirmed. NestJS is the selected backend direction; Expo/React Native is
  accepted for the mobile foundation under D014. Other architecture calls
  remain proposals until recorded as accepted in [DECISIONS](docs/DECISIONS.md).
- Set up documentation before application work. A specification packet permits
  specification work only. Scaffolding, dependencies and source imports require
  an approved implementation packet; do not treat a draft as approval.
- Follow an assigned task through its relevant checks, commit, push and merged PR
  into main. This Git workflow is authorized. Routine choices within that scope
  need no repeated permission. Deployment, distribution, provider purchases and
  messages to other people require their own authorization.

## Independent work

- Follow [AGENT-WORKFLOW](docs/AGENT-WORKFLOW.md). Each active packet has one owner,
  one branch/worktree, allowed paths, dependencies, interfaces and acceptance.
- Confirm the exact repository root and remote before editing. Never run a new
  repository task from either source application's checkout.
- A coordinator serializes task assignment and shared-file changes on main.
  Agents must not independently claim the same packet or edit another lane.
- Work autonomously after assignment. Raise a contract or ownership conflict
  before crossing the boundary; continue useful work that does not depend on it.
- Do not revert another person's changes, reuse another agent's checkout, change
  its branch, terminate its servers or consume its simulator without coordination.
- Keep handoffs in the packet with commit/PR links, actual checks, limitations and
  remaining decisions. Chat history is not a required input to another worker.

## Product and data

- Use Gloups and health coach in public copy. Never name health-app competitors
  in product copy, documents, screenshots, commits or release notes.
- Plan for international users from the first contract: language, locale,
  timezone, country, units and currency are separate concepts. Follow
  [I18N](docs/I18N.md); do not infer nationality or data region from language.
- Keep estimates, observations and derived values distinct. Missing is not zero.
  Retain provenance, calculation versions, retry identity and account ownership.
- The model explains approved facts and proposes bounded actions. It cannot be
  the source of arithmetic, record permissions or silent changes to goals.
- HIPAA BAA/HDS support is deferred. Assess applicable consumer obligations and
  prepare future healthcare boundaries without making compliance claims.
- No real health data, identity tokens, secrets or signing material in Git,
  fixtures, prompts for debugging, screenshots, logs, issues or public feedback.
- Existing Gloups data-discard authorization does not cover Mioum by assumption.
  Confirm usage, ownership and preservation duties before a destructive cutover.

## Code, tools and design

- Follow [ARCHITECTURE](docs/ARCHITECTURE.md) for placement and
  [CODE-STANDARDS](docs/CODE-STANDARDS.md) for code rules. Keep changes focused.
  Add shared packages only for actual consumers and an approved contract.
- Use the Bun version pinned in `.bun-version` and `package.json`, Bun workspaces
  and one root `bun.lock`. Install with `bun install --frozen-lockfile`.
  Turborepo replaces the earlier Nx policy under decision D011.
- Run workspace tasks from the root. Inspect the actual graph with
  `bun run turbo run build --dry=json`; use `bun run build`, `bun run docs:dev`
  or `bun run mobile:dev` for the current workspaces. Consult installed
  help before adding task options. New product projects still need approval.
- Use Ultracite with Oxlint, Oxfmt and anti-slop when tooling is installed. Run
  `bunx ultracite fix` before committing relevant JS/TS/config changes, then
  `bunx ultracite check`. Run `bunx ultracite doctor` when changing the setup.
  Husky runs lint-staged before commits and commitlint on the commit message;
  use Conventional Commits, for example `chore: update workspace tooling`.
- Before every new UI flow, inspect actual screens through connected Mobbin and
  record selected flow links with neutral labels in [DESIGN](docs/DESIGN.md).
  Follow native conventions on each platform. Keep one canonical brand palette.

## Verification and delivery

- Agents must not write, extend or rewrite unit tests or use TDD/red-green work.
  The owner may write unit tests manually. This overrides skill defaults.
- Behavioral acceptance uses E2E Army against the running service and real app.
  Backend work uses isolated PostgreSQL once that service exists. Native work
  needs a regular iPhone, iPhone Duo and relevant Android journeys with actual
  device/runtime recorded. Physical devices cover health imports and background
  behavior. Static checks and exports do not replace that evidence.
- Documentation checks use the actual Git diff, local links, instructions,
  scope/status consistency and secret/reference exclusions. Do not run invented
  build commands. Follow [VERIFICATION](docs/VERIFICATION.md).
- GitHub Actions usage is exhausted. Use relevant local evidence and do not add
  paid/automatic workflows, wait for CI or claim a check ran when unavailable.
- Preserve ignored user-owned state. Never commit databases, generated native
  projects, caches, credentials or signing material. Deployment and store
  distribution remain separate from Git integration.

The selected Clerk application is fixed; do not create another. PostHog EU is
preferred. Existing service facts and unknowns live in [SERVICES](docs/SERVICES.md).
