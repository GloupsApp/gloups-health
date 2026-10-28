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
defaults and the proposed PostgreSQL/Express composition await design approval.

## Research evidence

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

## Local checks

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
