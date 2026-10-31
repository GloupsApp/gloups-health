# Shared package conventions

- Keep packages independent of application source and use public package exports for consumers. Declare internal dependencies as `workspace:*`; preserve an acyclic workspace graph.
- Read the package's README and scripts before changing its build or exports. Keep emitted JavaScript and declarations out of authored source.
- Compiler presets belong in `@gloups/typescript-config`; lint/format profiles belong in `@gloups/ultracite-config`. Application aliases, include globs, and output paths stay in consumers.
- Preserve the strict compiler baseline and framework-specific lint coverage. Do not widen a documented vendor exception to authored application code.
- Meaningful shared-package changes need a Changeset following [../.changeset/README.md](../.changeset/README.md). All workspaces remain private; versioning is separate from publishing.

Read [contracts/AGENTS.md](contracts/AGENTS.md) or [ui/AGENTS.md](ui/AGENTS.md) for those packages. Validation of shared configuration includes affected consumers; the assigned validation owner selects commands from the package scripts and CI.
