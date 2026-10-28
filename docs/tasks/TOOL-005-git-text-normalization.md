# TOOL-005: Git text normalization

Status: Assigned. Owner and integration coordinator: Codex, current Git
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

Implementation begins after the assignment is merged and read back from main.
Record exact checks, commit/PR links, limitations and cleanup here.
