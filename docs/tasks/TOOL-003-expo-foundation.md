# TOOL-003: Expo SDK 58 foundation

Status: Assigned. Owner and integration coordinator: Codex, current Expo setup
chat. The owner's 28 October 2026 request, "setup expo sdk 58 + tsconfig +
ultracite", authorizes this mobile bootstrap and its workspace integration.

## Intent and inputs

Create a minimal private `@gloups/mobile` workspace in `apps/mobile` using Expo
SDK 58. Inherit the strict TypeScript baseline approved in TOOL-002 and extend
the existing Ultracite/Oxlint/Oxfmt setup with React rules. Use the official
blank TypeScript template, reduce it to an empty native root, and keep source
under `src/`. Product flows and domain contracts remain separate assignments.

Reviewed registry versions: Expo `58.0.20`, React `19.3.0`, React Native
`0.88.0`, React types `19.3.0` and the existing TypeScript `6.0.3`.
`create-expo-app` `5.0.0` and `expo-template-blank-typescript` `58.0.29`
provide the scaffold. Verify compatibility against the installed SDK before
pinning direct dependencies exactly. Bun remains `1.4.4`, with one root lockfile.

## Ownership

Repository: `/Users/maximebourmaud/Personal/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Base: `1ccabbfb671c0120645820dfdf55aeb350494ce0`.
Assignment branch: `codex/tool-003-expo-assignment`.
Implementation branch: `codex/tool-003-expo-foundation`, based on the merged
assignment. Worktree:
`/Users/maximebourmaud/.codex/worktrees/expo-sdk58-4086/gloups-health`.

Allowed paths: `apps/mobile/**`, root `package.json`, `bun.lock`, `turbo.json`,
`oxlint.config.ts`, `oxfmt.config.ts`, `.gitignore`, `AGENTS.md`, `README.md`,
`ROADMAP.md`, `CONTRIBUTING.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`,
`docs/CODE-STANDARDS.md`, `docs/DESIGN.md`, `docs/DECISIONS.md`,
`docs/VERIFICATION.md`, `docs/README.md`, `docs/tasks/README.md`, this packet,
`docs/plans/README.md`, `docs/plans/2026-10-28-expo-foundation.md`,
`docs/verification/README.md`,
`docs/verification/2026-10-28-expo-foundation.md` and an empty Changeset.
Other packets, API/web source, shared domain schemas, canonical tokens and the
shared TypeScript safety settings are outside this lane.

Consumes: the existing Bun workspace, Turborepo tasks, strict TypeScript base
and Ultracite configuration. Produces: an Expo SDK 58 startup shell, inherited
mobile compiler settings, React lint rules and root mobile development/export
commands. This authorizes no provider project, app identifier registration,
credentials, deployment, store distribution or product screen design.

Reserve Metro port `8083` only while this task runs. No database or device is
reserved at assignment. Record any later device allocation and release in the
handoff. Read this assignment back from merged main before implementation.

## Acceptance

- Install from the root with Bun `1.4.4`; retain one frozen root lockfile and
  exactly pinned direct dependencies compatible with SDK 58.
- Verify that the mobile compiler inherits every shared safety check and the
  SDK's runtime settings, with declaration checking enabled. Document an actual
  dependency declaration conflict before making a scoped exception.
- Include mobile typechecking in the root command and iOS/Android Metro exports
  in the Turborepo build graph. Root commands must work from the repository root.
- Run Ultracite fix/check/doctor, typechecking, builds, Expo dependency/config
  checks and Changesets status. Confirm generated native projects, Expo state,
  builds and credentials stay ignored. Agents write no unit tests or TDD.
- Review the actual diff, local links, instructions, scope/status consistency
  and secret/reference exclusions. Record exact results and limitations.
- Exports establish bundling only. Record actual native launch evidence if
  available; regular iPhone, iPhone Duo, Android and E2E Army journey acceptance
  remain required for later product behavior.
- Commit, push, open and merge a PR after relevant local checks. GitHub Actions
  are unavailable; deployment and distribution have separate authorization.

## Handoff

Implementation and verification are pending. The
[implementation plan](../plans/2026-10-28-expo-foundation.md) records the setup
sequence. This packet and D014 record the owner's bounded Expo approval;
unrelated product architecture proposals remain open.
