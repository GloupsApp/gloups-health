# Code standards for future implementation

Workspace tooling, a Blume documentation site and a minimal Expo SDK 58 shell are
installed. Product features still need an approved task. The root agent policy takes precedence over
skill defaults, including any unit-test/TDD instructions.

## TypeScript configuration

Extend the root [tsconfig.base.json](../tsconfig.base.json) in each approved
TypeScript project. It starts from the
[Blume base](https://github.com/haydenbleasel/blume/blob/main/tsconfig.base.json)
and enables every `strict` family check through `strict: true`.
Additional checks require exact optional properties, checked indexed access,
bracket access for index signatures, explicit overrides, complete returns and
valid side-effect imports. Unused locals/parameters, switch fallthrough,
unreachable code, unused labels and inconsistent import casing are errors.
Declaration checking stays enabled in the shared base with `skipLibCheck: false`.
See the [TypeScript compiler reference](https://www.typescriptlang.org/tsconfig/).

The base uses ES2022 output semantics, ES2023 libraries, ES modules and bundler
resolution with no emit. Each consuming project sets its own source scope,
runtime types, libraries, JSX and emission settings.
An approved NestJS packet must review module resolution, decorators and emitted
imports for its actual runtime. These tooling defaults do not select a product
framework. Keep safety checks inherited; document and review any exception.

`bun run typecheck` checks root tooling, the docs configuration and mobile source.
Both workspace build
entry points require the relevant compiler checks. Turborepo includes the shared
base in its global dependencies so a baseline change invalidates cached tasks.
TypeScript 6.0.3 is pinned for compatibility with the current Blume/Astro compiler
API dependencies. Node types follow the workspace's minimum supported Node major.

The documentation project overrides `skipLibCheck` to `true`.
Blume 2.2.6 and its dependencies currently fail declaration checking with missing
optional adapter types and invalid published declarations. All authored docs
configuration still receives the inherited strict checks. This exception does
not authorize another project to skip declaration checking. Recheck and
remove it when compatible dependency declarations are available; the exact
diagnostics and reproduction command are in the
[verification record](verification/2026-10-28-strict-typescript.md).

The mobile project extends `expo/tsconfig.base` followed by the shared base. It
inherits Expo's JSX mode and `react-native` resolution condition while retaining
the shared safety checks, ES2022 target and ES2023 library without browser globals.
Its source scope and React runtime types are explicit. TOOL-003 records a separate
`skipLibCheck: true` exception for three errors in React Native 0.88.0's generated
declarations. Every strict check still applies to authored mobile code. The shared
base remains `skipLibCheck: false`; no other project inherits either exception.
Recheck with `bun run tsc --project apps/mobile/tsconfig.json --skipLibCheck false`
after a compatible SDK update. The [Expo evidence](verification/2026-10-28-expo-foundation.md)
records the actual diagnostics and removal condition.

The API has an owner-approved `skipLibCheck: true` exception under AUTH-003
(29 October 2026). Better Auth core, Better Call, Drizzle ORM and thread-stream
publish declarations with missing optional types and incompatible members: the
first API compile reported 99 dependency errors and no authored-source errors.
All strict authored-code checks remain inherited; the shared baseline stays
`skipLibCheck: false`. Recheck with
`bun run --filter @gloups/api typecheck --skipLibCheck false` after compatible
dependency releases and remove this exception once their declarations pass. See
the [authentication evidence](verification/2026-10-28-authentication-execution.md).

## API architecture

D016 confirms the official NestJS Fastify adapter, Drizzle ORM and DDD with
Onion architecture. Follow [ARCHITECTURE](ARCHITECTURE.md#ddd-and-onion-architecture)
for context/layer placement. Domain invariants and application use cases are
plain TypeScript; their dependencies point inward through core contracts/ports.
Do not import NestJS, Fastify, Better Auth, Drizzle, driver types or concrete
infrastructure into domain/application. Plain application DTOs are separate from
decorated HTTP validation DTOs and database schemas.

Keep controllers/guards and protocol conversion in presentation; implement
repository, identity, email and unit-of-work ports in infrastructure. Use Nest
modules as the outer composition root to bind ports through tokens/factories.
Map Drizzle rows and Better Auth sessions into explicit core values rather than
casting or exporting their external types. A use case owns transaction/retry
intent; its Drizzle adapter owns the concrete transaction/client. Cross-context
code consumes approved contracts rather than another context's tables or
repositories. Review real import direction and wiring alongside E2E acceptance;
this rule does not authorize scaffolding, a new lint dependency or unit tests.

## Implementation rules

Use strict TypeScript and validated boundary schemas. Prefer unknown to any,
explicit units and narrow domain values. Keep functions/features focused; avoid
single-use abstractions, speculative shared packages and unrelated refactors.
Await asynchronous work and handle cancellation, bounds and failures explicitly.
Do not log raw health records, tokens, provider payloads or sensitive URLs.

Keep server credentials/provider code out of mobile contracts. Authorize records
from the verified identity; validate model/provider output as untrusted input.
Do not expose ORM entities directly. Keep retries, concurrency and transactional
writes inside the use-case boundary rather than patching values in the UI.

Use Ultracite with Oxlint, Oxfmt and anti-slop for JS/TS/config. The root Oxlint
configuration includes the React preset for mobile components. The approved
tooling setup pins compatible versions and commits one Bun lockfile. Match the
configured formatting; do not carry unrelated formatter changes in a feature PR.
Use the applicable Ultracite/Turborepo/Expo guidance and inspect installed help
rather than guessing commands or importing another repository's build rules.

Use native platform components, accessible labels, keyboard/font behavior,
light/dark themes and reduced motion. Every user-facing string needs French and
English coverage. Follow [I18N](I18N.md) and [DESIGN](DESIGN.md).

No agent-written/modified unit tests and no TDD. Use meaningful E2E Army
acceptance over the actual HTTP/app boundary; static checks are supplementary.
Never hand-edit generated native projects, generated schemas or build outputs.
