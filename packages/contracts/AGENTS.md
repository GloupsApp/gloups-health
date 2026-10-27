# Shared contracts scope

Read root [AGENTS](../../AGENTS.md), [CONTRACTS](../../docs/CONTRACTS.md) and
[I18N](../../docs/I18N.md). This directory contains instructions only, not a package.

Only approved API/mobile wire schemas, explicit shared identifiers and truly
shared value contracts belong here. No ORM entities, framework classes, server
secrets, provider clients or speculative shared abstractions. An agent may not
establish a wire contract by exporting a type from its branch.

The integration owner controls public exports, schema versions and compatibility.
Domain workers propose changes through their owned specification/handoff. Before
parallel implementation, name exact producers/consumers and accepted revisions.
Validate language-neutral error codes, units, time semantics, permission context,
retry/conflict behavior and observed/estimated/derived distinctions. Behavioral
acceptance uses the consumers' real boundaries; no agent unit tests or TDD.
