# Code standards for future implementation

No runtime/tooling is installed in this repository yet. These rules apply when
an approved task introduces code. The root agent policy takes precedence over
skill defaults, including any unit-test/TDD instructions.

Use strict TypeScript and validated boundary schemas. Prefer unknown to any,
explicit units and narrow domain values. Keep functions/features focused; avoid
single-use abstractions, speculative shared packages and unrelated refactors.
Await asynchronous work and handle cancellation, bounds and failures explicitly.
Do not log raw health records, tokens, provider payloads or sensitive URLs.

Keep server credentials/provider code out of mobile contracts. Authorize records
from the verified identity; validate model/provider output as untrusted input.
Do not expose ORM entities directly. Keep retries, concurrency and transactional
writes inside the use-case boundary rather than patching values in the UI.

Use Ultracite with Oxlint, Oxfmt and anti-slop for JS/TS/config. The approved
bootstrap pins compatible versions and commits one Bun lockfile. Match the
configured formatting; do not carry unrelated formatter changes in a feature PR.
Use the applicable installed Ultracite/Nx/Expo guidance and inspect actual help
rather than guessing commands or importing another repository's build rules.

Use native platform components, accessible labels, keyboard/font behavior,
light/dark themes and reduced motion. Every user-facing string needs French and
English coverage. Follow [I18N](I18N.md) and [DESIGN](DESIGN.md).

No agent-written/modified unit tests and no TDD. Use meaningful E2E Army
acceptance over the actual HTTP/app boundary; static checks are supplementary.
Never hand-edit generated native projects, generated schemas or build outputs.
