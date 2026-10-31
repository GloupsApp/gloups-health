# Contract conventions

- Own runtime schemas and the shared password policy in `src/index.ts`. Keep the client boundary in `src/client.ts` and OpenAPI generation in `tools/generate.ts` aligned with them.
- Change OpenAPI and SDK output through `bun run contracts:generate`; never patch `generated/` by hand. Give generation and its outputs one writer when work is delegated.
- Validate every HTTP success and error payload at the owned client boundary, including empty/204 results that generated validators can skip. Obtain cookies through the supplied callback and keep `credentials: "omit"`.
- Keep the generated compiler project separate. Its `exactOptionalPropertyTypes` exception must not spread to authored code.
- Contract changes must account for both API producers and mobile consumers and follow the parent package's Changeset workflow.

The validation owner uses `bun run contracts:check`, contract build/typechecking, and affected API/mobile checks. `contracts:check` regenerates files and compares them with Git; for an uncommitted contract change, inspect the expected diff and verify regeneration is stable instead of treating every diff as a generator defect.
