# TOOL-005: Git text normalization

Status: Done on [PR #16](https://github.com/GloupsApp/gloups-health/pull/16) merge.
Owner and integration coordinator: Codex, current Git
attributes chat. The owner's 28 October 2026 request approves the exact root
`.gitattributes` contents below.

## Intent and inputs

Add `.gitattributes` with exactly:

```gitattributes
# Auto detect text files and perform LF normalization
* text=auto
```

## Ownership

Repository: `/Users/maximebourmaud/Personal/gloups-health`.
Remote: `git@github.com:GloupsApp/gloups-health.git`.
Assignment base: `c9838134616b6f6eea7ec60101d5fc53ca21c515`.
Assignment branch: `codex/tool-005-git-text-assignment`.
Implementation branch: `codex/tool-005-git-text-normalization`, based on the
merged assignment. Worktree:
`/Users/maximebourmaud/.codex/worktrees/git-text-normalization/gloups-health`.

Allowed paths: `.gitattributes`, `docs/tasks/README.md` and this packet.
Consumed interface: Git attributes. Produced interface: automatic text detection
and LF normalization when Git adds text content. No application, dependency,
lockfile or existing tracked-file renormalization is in scope.
One worker; no servers, devices or databases are reserved. Read back the merged
assignment on main before implementation.

## Acceptance

- The root file matches the owner's two lines exactly, with LF line endings.
- `git check-attr text` reports `auto` for representative repository paths.
- Git's clean conversion gives identical object IDs for synthetic LF and CRLF
  text using the new attributes; no object or fixture needs to be persisted.
- Inspect the actual diff, local Markdown links, scope/status consistency and
  secret/reference exclusions; run `git diff --check`.
- Commit, push and merge after relevant local checks, retaining Husky hooks.
  No unit tests, application builds, native acceptance or CI are required for
  this metadata change. GitHub Actions usage is exhausted.

## Handoff

Assignment [PR #15](https://github.com/GloupsApp/gloups-health/pull/15) merged at
`7047682ae228c705f2710ca97c0c269bda07e0bd` and was read back from main before
implementation. The exact two-line file was added in
[commit 6e34277](https://github.com/GloupsApp/gloups-health/commit/6e34277794bf3460f50961707a289830c7602516).
The delivery PR above contains the final change and this handoff.

Checks used Bun 1.4.4 from `/tmp/gloups-tooling-20261028/bun-1.4.4` on PATH:

- `bun install --frozen-lockfile` passed without manifest/lockfile changes.
- `bunx ultracite fix .gitattributes docs/tasks/README.md docs/tasks/TOOL-005-git-text-normalization.md` and the equivalent
  `bunx ultracite check` passed for both supported Markdown files. Git-specific
  checks below verify `.gitattributes` itself.
- An exact byte comparison confirmed the requested file with LF line endings.
- `git check-attr text -- .gitattributes README.md package.json bun.lock`
  reported `auto` for every path.
- `git hash-object --stdin --path=README.md`, supplied synthetic LF and CRLF
  text through standard input, returned the same object ID
  `1c35acce6eccb6f2f6971816e50c65c5e7bfac75` for both. No object was written.
- Local Markdown link targets, the actual staged diff, task status/scope and
  secret/reference exclusions were reviewed. `git diff --check` and
  `git diff --cached --check` passed.
- The real Husky pre-commit and commit-message hooks passed for the assignment
  and file implementation commits.

No existing tracked files were renormalized. Application builds, E2E Army,
devices and CI were not needed or claimed for this Git metadata change. No unit
tests were added or changed. There are no remaining product decisions or
downstream blockers for the accepted Git attributes interface.
No servers, ports, databases or devices were created. Only ignored dependencies
were installed in the isolated worktree; archive it after integration. Deployment
and distribution remain outside this task.
