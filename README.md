# Gloups

Gloups is a health coach for sportspeople. It brings nutrition, training, sleep
and optional menstrual cycle tracking together to help each person decide what
to eat, how to train and when to rest, with explanations based on their records.

The launch target is worldwide, on iOS and Android, with French and English
first. Regional formats, units and timezones are independent of interface
language. The first unified release includes workout creation and execution:
sets, repetitions, weights, rest timers and progression.

## Repository status

This is the new private planning and implementation home for the unified product.
It contains engineering documentation, Bun/Turborepo tooling, a local Blume site
and AUTH-003 authentication source: NestJS/Fastify with Drizzle/Postgres and an
Expo SDK 58 Router client. Credential/lifecycle API cases have local E2E evidence;
complete native/provider acceptance remains pending. Health/product web flows,
deployment and store release remain unimplemented.

The existing applications remain source references. No customer data,
credentials, native projects or deployment configuration has been migrated.
The canonical source palette is imported for the new authentication screens.
HIPAA BAA and HDS support are future work; consumer privacy and security remain
part of the first release.

## Start here

- [Product scope](docs/PRODUCT.md) and [engineering roadmap](ROADMAP.md).
- [Agent instructions](AGENTS.md) and [contribution workflow](CONTRIBUTING.md).
- [Architecture proposal](docs/ARCHITECTURE.md) and [internationalization](docs/I18N.md).
- [Independent agent workflow](docs/AGENT-WORKFLOW.md) and [task packets](docs/tasks/README.md).
- [Decisions](docs/DECISIONS.md), [verification](docs/VERIFICATION.md) and [documentation index](docs/README.md).

Canny remains the public roadmap and feedback home. Repository tasks describe
engineering work; they do not set public feature availability. The bilingual
[Canny draft](docs/marketing/roadmap/2026-10-27-unified-health-coach.md) is unpublished.

Product scaffolding and code imports start only after the relevant design,
contracts and task scope are approved. Assigned agents can prepare separate
specifications now; an unassigned packet is not a claim or permission to build.

## Workspace commands

Use Bun 1.4.4 and the runtime pinned for the workspace: the API uses Node 26.13.0;
the root minimum remains Node 24.15.0. Direct dependencies use reviewed exact pins.

```sh
bun install --frozen-lockfile
bun run check
bun run docs:dev
bun run docs:build
bun run mobile:dev
bun run mobile:build
```

`bun run build` checks types, builds the documentation site and exports iOS/Android
JavaScript bundles through Turborepo. See the [mobile setup](apps/mobile/README.md)
and [API setup](apps/api/README.md) for owned local commands and verification limits.
Husky checks staged files before commits and validates Conventional Commit
messages. See [CONTRIBUTING](CONTRIBUTING.md) for formatting and Changesets.
