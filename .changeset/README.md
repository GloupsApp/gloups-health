# Package version records

Run `bun run changeset` from the repository root to record a package change.
Select the affected packages, choose the version bump and describe the change.
For repository-only work, `bun run changeset --empty` creates an empty record.

`bun run changeset:status` reports pending releases against `main`.
`bun run version-packages` applies approved version bumps and changelog entries.
Private packages can receive versions/changelogs; private-package tagging is
disabled. The current `@gloups/docs` workspace is private.

No publishing script or release automation is configured. Publication and
deployment need separate authorization. See [CONTRIBUTING](../CONTRIBUTING.md)
and the [Changesets documentation](https://changesets.dev).
