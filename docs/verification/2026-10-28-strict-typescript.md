# Strict TypeScript verification, 28 October 2026

Scope: [TOOL-002](../tasks/TOOL-002-strict-typescript.md). Assignment merged in
[PR #7](https://github.com/GloupsApp/gloups-health/pull/7) at
`4f1df4c81768a704803ab0c6d6cc38cffa6498a6` and was read back before implementation.
Branch: `codex/tool-002-strict-typescript`. The packet records final integration.

## Environment and compiler choice

Checks use macOS arm64, Node.js 26.12.1 and Bun 1.4.4 from
`/tmp/gloups-tooling-20261028/bun-1.4.4`, first on PATH. The global Bun remains
unchanged. No service, database, device or simulator is involved.

The npm registry reports TypeScript 7.0.2 as latest stable. Its package exports
do not expose the existing compiler API types used by Astro, and the installed
`@astrojs/check` and Twoslash peer ranges permit TypeScript 5/6. The latest stable
compatible release is TypeScript 6.0.3, now pinned directly. Its existing locked
version is unchanged. `@types/node` 24.19.2 is the latest stable Node 24 type
release checked at setup, matching the workspace's minimum supported Node major.
Blume retains its existing Node 22 type dependency. No provider package was added.

## Upstream comparison and project scope

The [requested Blume configuration](https://github.com/haydenbleasel/blume/blob/main/tsconfig.base.json)
was read through the GitHub connector. The shared base preserves all its options
except `skipLibCheck`, which changes from `true` to `false`. It adds:

- `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` and
  `noImplicitReturns` set to `true`.
- `noUnusedLocals`, `noUnusedParameters` and `noUncheckedSideEffectImports` set
  to `true`.
- `allowUnreachableCode` and `allowUnusedLabels` set to `false`.
- `forceConsistentCasingInFileNames` set to `true`.

`strict: true` enables the full strict family. ES2022, ES2023 libraries, ESNext
modules, bundler resolution and no emit are preserved. Runtime globals, JSX and
source scope belong to consumers; future emitting/backend projects still need
their own approved runtime configuration.

Both `bun run tsc --project tsconfig.json --showConfig` and
`bun run tsc --project apps/docs/tsconfig.json --showConfig` passed. Their output
shows the inherited safety settings and exact inputs: root `oxfmt.config.ts`
and `oxlint.config.ts`, plus docs `blume.config.ts`. Generated Blume/Astro files
and reserved product folders are outside these projects. The docs project adds
DOM libraries, React JSX handling and Node types for its framework declarations.

The first root typecheck found TS2488 in both existing tooling configs: preset
`ignorePatterns` is optional. Both spreads now use `?? []`.

## Documentation dependency exception

With TypeScript 6.0.3 and declaration checking enabled, this command fails:

```sh
bun run tsc --project apps/docs/tsconfig.json --skipLibCheck false --pretty false
```

The run reported 122 diagnostics, all in `node_modules`: 49 TS2307 missing
modules, six TS2304 missing names, 66 TS2411 incompatible index signatures and
one TS2503 missing namespace. Examples include Astro's optional Markdown package,
Blume's optional properties against `JSONType`, and Unstorage's unused adapter
dependencies/runtime globals. These are published declaration errors; adding
every optional provider would still leave the invalid declarations.

The docs project alone sets `skipLibCheck: true`. Its authored configuration
continues to receive every inherited strict check, while dependency declaration
diagnostics are skipped. The shared base and root tooling keep `false`. No type
stubs, dependency patches or product-level exception were introduced. Remove
this override after compatible published declarations pass the command above.

## Local checks and delivery

- Baseline frozen install and `bun run check` passed. Baseline `bun run build`
  replayed the existing successful cached documentation build; it was not a new
  compilation.
- `bun run typecheck` passed after the optional-array fixes and the documented
  docs-only declaration exception, with an uncached docs compiler run.
- `bun run turbo run build --dry=json` discovers docs `build` and `typecheck`;
  `build` depends on `@gloups/docs#typecheck`. The shared base appears as a hashed
  global file input, so configuration changes invalidate cached tasks.
- `bun run changeset --empty` added the repository-only version record.
- A second upstream comparison confirmed 16 preserved options, one changed
  option (`skipLibCheck`) and the nine additions listed above.
- `bunx ultracite fix` and `bunx ultracite check` passed across 61 matched files.
  `bunx ultracite doctor` reported eight passed diagnostics, zero warnings and
  zero failures. Both config presets still load after the optional-array fixes.
- `bun install --frozen-lockfile` passed, checking 864 installs across 1,026
  packages without changes.
- `bun run build` passed the root compiler and docs typecheck dependency, then
  performed an uncached Blume build into the worktree's `apps/docs/dist`.
  Generated output remains ignored. Both Turborepo tasks succeeded; the docs
  typecheck result was cached from the successful direct run.
- `bun run changeset:status` passed. The existing private docs patch remains
  pending; the new empty record adds no package bump. No versioning or publishing
  command ran.
- `python3 /tmp/gloups-strict-typescript-check-docs.py` passed 188 local Markdown
  link/anchor checks across 50 files. The checker uses the current worktree and
  excludes the vendored local skill. `git diff --check` passed. The actual diff
  was reviewed for scope/status consistency, credentials, health data and
  excluded references; no generated artifacts or reserved product files changed.

The actual implementation commit
[3a9c584](https://github.com/GloupsApp/gloups-health/commit/3a9c5847dea000ebf159e96b0affc980080a6f5b)
passed both Husky hooks, with 19 staged files checked and the Conventional Commit
message accepted. An independent Superpowers review found no critical, important
or minor issues and confirmed the declaration exception is isolated to docs.
Integration is [PR #8](https://github.com/GloupsApp/gloups-health/pull/8), including
the packet's final handoff; its merge commit is the integrated main revision.
No unit tests or TDD, GitHub Actions, product acceptance, deployment or
distribution are part of these tooling checks.
