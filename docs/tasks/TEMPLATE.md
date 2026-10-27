# TASK-ID: concrete deliverable

Status: select the actual internal state. Owner, branch, worktree/base revision
and shared resources must be recorded by the coordinator before work starts.

## Intent and inputs

State the user problem, approved requirements, spec/contract versions and the
minimum references another worker needs. Separate confirmed values from proposals.

## Ownership

List exact allowed paths and the shared/other-lane paths excluded from this task.
List consumed interfaces and the precise artifacts/interfaces this task produces.
Dependencies must distinguish what can be drafted now from what must be accepted
before implementation. Request a shared change through the integration owner.

## Acceptance

List checkable expected behavior, values/persistence and international, consent,
offline, concurrency and failure cases relevant to this slice. Use real HTTP/app
boundaries for behavior, or link/instruction consistency for documentation.
Agents do not write/modify unit tests or use TDD.

## Handoff

Record final commit/PR, actual checks/results, devices/runtimes and limitations;
accepted interfaces and remaining decisions; downstream impact; resources
created/released and the next dependency. A draft spec is not product approval.
