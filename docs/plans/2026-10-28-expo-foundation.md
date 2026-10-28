# Expo SDK 58 foundation implementation plan

> For agentic workers: use Superpowers executing-plans in this session.
> Repository instructions require autonomous execution after assignment,
> no unit tests or TDD, and a merged assignment before implementation.

**Goal:** Add the requested Expo SDK 58 workspace with strict TypeScript and
the existing Ultracite tooling.

**Architecture:** Use Expo's blank TypeScript template and an empty React Native
root. Keep mobile runtime settings in its compiler configuration and inherit
the root safety checks. Retain the existing Bun/Turborepo tooling.

**Tech stack:** Bun 1.4.4, Expo 58.0.20, React 19.3.0, React Native 0.88.0,
TypeScript 6.0.3 and Ultracite 8.1.0 with Oxlint/Oxfmt.

**Spec:** [TOOL-003](../tasks/TOOL-003-expo-foundation.md), approved by the owner's
explicit setup request. Expo's
[blank TypeScript template](https://docs.expo.dev/more/create-expo/),
[TypeScript guide](https://docs.expo.dev/guides/typescript/) and
[monorepo guide](https://docs.expo.dev/guides/monorepos/) inform the setup.

## Constraints and review focus

Pin direct versions after SDK compatibility checks. Preserve the shared strict
baseline, including declaration checking. Keep one lockfile and root task entry
points. Product flows, provider connections, native identifiers and generated
native projects are outside this setup. Verify that mobile React dependencies
resolve consistently alongside the existing docs workspace and that Turborepo
exports both target platforms. Record bundling separately from native journeys.

## Task 1: Record assignment

- [x] Merge this packet, plan and D014 through an assignment PR.
- [x] Read the merged assignment, create the implementation branch and verify
      the existing frozen install and compiler baseline with Bun 1.4.4.

## Task 2: Integrate the mobile workspace

Files: `apps/mobile/package.json`, `app.json`, `tsconfig.json`, `index.ts`,
`src/app.tsx`, `README.md`, `AGENTS.md`; root `package.json`, `bun.lock`,
`oxlint.config.ts` and generated-file exclusions if needed.

Consumes the existing root tools and Expo's reviewed blank template. Produces
`@gloups/mobile`, its SDK-compatible strict compiler configuration and root
`mobile:dev`, `mobile:ios`, `mobile:android` and `mobile:build` commands.

- [x] Scaffold with pinned `create-expo-app`, without installation or generated
      agent instructions; preserve the existing scoped instructions.
- [x] Reduce the template to a registered empty native root under `src/`, a
      private manifest, minimal local app config and mobile setup instructions.
- [x] Inherit Expo runtime configuration and the shared strict base; include
      only authored entry/source files and set React runtime types explicitly.
- [x] Add SDK-compatible exact dependencies through the root lockfile, mobile
      `typecheck` and iOS/Android `build` scripts, and React lint rules.
- [x] Integrate root commands and update current-state documentation, keeping
      accepted foundation work separate from unimplemented product domains.

## Task 3: Verify and integrate

- [x] Run frozen install, Ultracite fix/check/doctor, effective compiler settings,
      root typecheck, the actual Turborepo build graph, both Metro exports and
      the existing docs build. Resolve any authored-code/configuration errors.
- [x] Run Expo's installed dependency/config checks and reviewed Expo Doctor.
      Start Metro on port 8083, verify its status, and stop the owned process.
- [x] Review local Markdown targets, every changed file, generated-file ignores,
      scope/status consistency and secret/reference exclusions. Write the dated
      verification record with actual outcomes and native-journey limitations.
- [x] Review the complete branch, commit with real Husky hooks, push, create
      and attach [PR #10](https://github.com/GloupsApp/gloups-health/pull/10).
- [x] Finish the packet handoff in PR #10; integration completes on its merge.
