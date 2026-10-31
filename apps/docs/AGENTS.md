# Documentation conventions

- This workspace uses Blume; take commands from its `package.json` and configuration from `blume.config.ts`.
- Keep local setup, architecture, and validation instructions in their existing canonical documents. Link to them instead of copying them into multiple agent files.
- Verify documented commands against workspace scripts and describe behavior supported by the current implementation. Use synthetic examples without credentials or health records.
- Keep task progress and agent assignments out of published documentation.

The validation owner uses `bun run docs:build` for changes to the documentation site and reports missing content or dependencies as blockers. Do not create placeholder content just to make an unrelated build pass.
