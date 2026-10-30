# Changesets

Use `bun run changeset` for a meaningful change to a shared package. Select the affected packages and write the user-visible change. Configuration packages and UI use the same workflow as contracts.

`bun run changeset:status` reads the pending release plan. `bun run version-packages` consumes that plan, updates versions/changelogs and internal dependency ranges, and should be committed as a separate version change. Reinstall with the pinned Bun version after changing package manifests. Keep `workspace:*` for internal dependencies.

All Gloups workspaces are currently private. The configuration versions private packages and does not create Git tags for them. This repository has no npm publishing workflow; adding a release entry does not publish code or require registry credentials.

Do not use comparison flags or read Git history to reconstruct changes. Write the Changeset from the issue, current files, and the change being implemented.
