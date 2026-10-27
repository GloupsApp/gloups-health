# Implementation plans

No application implementation plan is approved yet. Documentation/specification
work is available through the [task packets](../tasks/README.md).

After a relevant spec/contract is approved, write an implementation plan with
exact owned files, consumed/produced interfaces, dependencies, acceptance through
real boundaries, shared-file integration and a handoff. Separate independently
reviewable domains. Do not make one agent read a private chat to discover a value,
command, signature or acceptance rule.

Use the available Superpowers planning guidance when applicable, with repository
placement and verification policy taking precedence: no agent-written/modified
unit tests and no TDD. E2E Army acceptance replaces unit-test/TDD examples from a
skill. A plan is not permission to deploy or distribute.
