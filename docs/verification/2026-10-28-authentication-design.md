# Authentication specification verification

Date: 28 October 2026. Task:
[AUTH-001](../tasks/AUTH-001-better-auth.md). This records documentation/research
evidence, not implemented authentication behavior or design approval.

## Scope and assignment

Repository: private `GloupsApp/gloups-health`, remote
`git@github.com:GloupsApp/gloups-health.git`, default branch `main`.
Worktree: `/Users/maximebourmaud/.codex/worktrees/015e/gloups-health`.
Initial base: `b309d6cba41cc4ee18bba00c6812b2a3935e28a3`.
Assignment [PR #19](https://github.com/GloupsApp/gloups-health/pull/19) merged at
`73d48e473fb07704d38592f4b2225adba4ff169c`. The packet was read from
`origin/main` before specification edits on `codex/auth-001-official-better-auth`.

The owner confirms Better Auth/NestJS/Expo SDK 58, official integrations/plugins
only, Google/Apple/email-password, native iOS Apple and browser Google/Android
Apple. D015 records those choices. Version pins, account/session/lifecycle
defaults awaited design approval in the initial delivery. The correction below
supersedes its Express/direct-pool proposal with the owner's D016 choices.

## Initial research evidence (PR #20)

- Read both supplied documents, distinguishing the 1.7 stable index from the
  1.8-beta Expo guide. Read the official current Expo, Express, NestJS integration,
  provider, session, linking, options and PostgreSQL docs linked by the
  [design](../specs/2026-10-28-authentication-design.md#sources-checked).
- npm registry stable metadata returned `better-auth`, `@better-auth/expo` and
  `auth` at `1.7.14`, with beta `1.8.0-beta.3`. Reviewed package peers and the
  matching NestJS `12.3.2` candidates; no auth package was installed.
- Inspected installed Expo `58.0.20` bundled module metadata and the SDK 58 Apple
  docs. This establishes candidate dependency ranges, not native compatibility.
- Read stable Better Auth Apple provider source for audience/nonce semantics and
  Apple's account-deletion/token-revocation Markdown guidance. Web fetching of
  Markdown indices was unsupported; direct read-only HTTPS fetches and the
  supplied stable index supplied the content. No provider endpoint was mutated.
- Tool inventory and plugin search for Mobbin found no connector/plugin. No
  Mobbin flow/screenshot was inspected; that dependency remains before UI source.
- A fresh Superpowers builder reviewer read the design and reported
  `nothing important left`. The design keeps implementation-specific provider,
  retention and resource settings explicit rather than claiming they exist.

## Initial local checks (PR #20)

The workspace used macOS arm64, Node.js `26.12.1` and Bun `1.4.4` from
`/tmp/gloups-tooling-20261028/bun-1.4.4`, first on PATH. The global Bun `1.4.2`
was not used for installs/hooks/checks.

- `bun install --frozen-lockfile` passed for existing workspace dependencies and
  prepared Husky without changing any manifest or `bun.lock`.
- Assignment formatting/checks, `git diff --cached --check`, an inline Python
  check of its two-file scope and all 28 local Markdown targets passed. The
  assignment commit passed staged Ultracite and Conventional Commit hooks.
- `bunx ultracite fix` with all 14 owned Markdown paths and
  `bunx ultracite check` passed. The latter covered all 79 supported repository
  files. No formatter/linter setting changed.
- `python3 /tmp/gloups-auth-doccheck.py` passed the 14-file staged scope,
  all local Markdown targets/explicit heading anchors, absence of unstaged or
  untracked source, and absence of literal private-key blocks. The script is a
  temporary documentation checker outside Git, not a unit-test fixture.
- `git diff --cached --check` passed. Reviewed the actual staged diff, including
  the new spec/evidence, decision/status consistency, absence of secrets/real
  data/excluded health-app references, and preservation of source history.
  Remaining Clerk references in active guides are explicitly historical or
  describe D015 supersession. Auth packages are absent from the unchanged lockfile.
- `bun run docs:build` passed both docs TypeScript checking and the existing Blume
  static build. This checks the current docs workspace, which builds its existing
  landing page; it is not proof that every repository Markdown file is rendered.
- `bun run turbo run build --dry=json` showed only `@gloups/docs` and
  `@gloups/mobile`, with build/typecheck tasks. No API or E2E task was invented.

No source, package manifest, lockfile, migration, generated native project or
provider configuration is part of this change. No unit tests, API acceptance,
E2E Army, native journey or live provider/email check ran for the design. There
is no auth service/database to exercise yet. No server, port, simulator or device
was allocated; only ignored existing dependencies/build output may be generated.
Existing user-owned state and provider resources are preserved. No deployment,
purchase, distribution, message to another person or data cutover occurred.

## Remaining work

Owner approval of the design precedes an exact implementation packet and
Superpowers implementation plan. That packet must settle runtime/database pins,
the native Apple exchange/cookie boundary, deletion retention/re-registration,
email/provider inventory and UI reference access at the relevant stage. Real
HTTP/database, native-device and authorized provider/email evidence remains
required; documentation/metadata checks do not substitute for it.

## Git delivery

Specification commit:
[2678c24](https://github.com/GloupsApp/gloups-health/commit/2678c2480e29a39303c8fb91ca204c83ae19a354).
The specification and this handoff integrate through
[PR #20](https://github.com/GloupsApp/gloups-health/pull/20). Its merged revision
is the main delivery record; merging the draft does not approve its proposals.
The commit passed staged formatting and Conventional Commit hooks. The task
worktree is preserved for the owner's design review and the subsequent plan.

## Fastify, Drizzle and DDD/Onion correction

The owner corrects the architecture on 28 October 2026. D016 records the official
NestJS Fastify adapter, Drizzle ORM and DDD with Onion architecture as confirmed.
Assignment amendment [PR #21](https://github.com/GloupsApp/gloups-health/pull/21)
merged at `87a3861796848be73e8a4e98d7cf3caeb10e1660`. The packet was read on
`origin/main` before revision work in `codex/auth-001-fastify-drizzle-onion`.
Initial research/checks above describe the earlier delivery, not new runtime
evidence for the corrected design.

Read the owner's
[NestJS/DDD/Onion reference](https://medium.com/@patrick.cunha336/structuring-a-nestjs-project-with-ddd-and-onion-architecture-65b04b7f2754),
the [original Onion explanation](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/),
[NestJS Fastify adapter docs](https://docs.nestjs.com/techniques/performance),
[Better Auth Fastify integration](https://better-auth.com/docs/integrations/fastify),
[official Drizzle adapter](https://better-auth.com/docs/adapters/drizzle),
[Drizzle PostgreSQL drivers](https://orm.drizzle.team/docs/get-started-postgresql),
[Drizzle migration guidance](https://orm.drizzle.team/docs/migrations) and the
Fastify content-parser/reply documentation linked from the revised spec.

Registry stable metadata returned `@nestjs/platform-fastify` `12.3.2`, matching
its `fastify` `5.12.7` and `@fastify/cors` `11.3.1` dependencies;
`@better-auth/drizzle-adapter` `1.7.14`, `drizzle-orm` `0.45.4` and `drizzle-kit`
`0.31.11`. The Better Auth adapter's Drizzle peer range includes `0.45.4`.
Drizzle's current version-1 docs include RC install examples; those do not change
the repository's stable-version policy. All pins are proposals until reviewed
for the implementation packet. No dependency or lockfile changed.

The revised spec covers scoped Fastify request-body preservation, form callbacks,
multiple cookies/redirects, normal Nest JSON parsing, Drizzle-owned schema/SQL
migrations and an inward dependency/import review. These are required future
acceptance outcomes, not claims that a running adapter or repository passed.
The DDD/Onion placement and thin HTTP/SDK/ORM adapters are Gloups implementation
rules based on the owner's reference; no sample business code or unit tests were
imported.

Correction checks on the same macOS/Node/Bun environment:

- `bun install --frozen-lockfile` passed with no dependency changes.
- `bunx ultracite fix` with the 14 owned Markdown paths and
  `bunx ultracite check` passed; the latter covered 79 supported repository files.
- `python3 /tmp/gloups-auth-architecture-doccheck.py` validated all changed local
  Markdown targets/anchors, the exact 14-file correction scope and absence of
  unstaged/untracked source or literal private-key blocks.
- `git diff --cached --check` passed. Actual diff/source/status review confirmed
  the accepted D016 choices, unapproved remaining lifecycle defaults, no secrets,
  real data or excluded health-app references, and no application scaffolding.
  Searches found Express/direct-pool/Prisma only in historical/supersession
  context in the active corrected documents; source inventories remain historical.
- `bun run docs:build` succeeded with two Turborepo cache hits for docs
  typecheck/build. The existing static landing page does not render all repository
  Markdown; local link/anchor/diff checks cover these document edits directly.
- A fresh Superpowers builder reviewer read the corrected design, API instructions
  and architecture guide and returned `nothing important left`.

No unit tests, E2E Army, API/database, native or live-provider/email acceptance
was added or claimed. No server, database, port or device was reserved. Ignored
user state and existing provider resources were preserved. The correction is
documentation only; it does not approve the rest of the design or implementation.

Correction commit:
[abfd2ff](https://github.com/GloupsApp/gloups-health/commit/abfd2ff35346955965a86f64b18379081a13adf3).
Integration [PR #22](https://github.com/GloupsApp/gloups-health/pull/22) includes
the corrected documentation and handoff; its merged revision is the corrected
main record. The commit passed Husky staged formatting and Conventional Commit
hooks. The worktree remains attached for the owner's review and subsequent plan.
