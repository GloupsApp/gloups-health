# Independent agent workflow

Workers should be able to finish an assigned packet without the founders' chat
history. Independence begins after task assignment and interface approval; it
never means concurrent edits to the same checkout or guessing another lane's API.

## Assignment and isolation

1. Read root instructions, decisions and the relevant scoped guide. Confirm
   `git rev-parse --show-toplevel` and `git remote get-url origin` identify this repo.
2. The human/coordinator assigns exactly one owner to a packet in the registry on
   main, with allowed paths, dependencies and review scope. Read back that merged
   assignment before starting. A local branch edit is not a globally visible claim.
3. Give each concurrent worker an isolated branch/worktree. Reuse a suitable
   checkout already owned by that worker; never reset another worker's checkout.
4. In the packet record the branch, base revision and resource reservations.
   Separate API/database, Metro, ports and emulator/device resources per lane.
5. Work autonomously within the assignment. Do not ask again for routine actions
   already authorized. Report missing product decisions and continue independent
   research/documentation while the dependent part waits.

The coordinator serializes assignments to avoid two agents taking one packet.
The bootstrap leaves specification packets unassigned. No product implementation
packet is Ready merely because its specification packet can start.

## Internal task states

| State                   | Meaning                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| Ready for specification | A worker may be assigned to write its bounded design/contract proposal |
| Draft implementation    | Product task depends on unapproved specifications or tooling           |
| Assigned                | One owner and workspace are recorded on main                           |
| Working                 | The assigned worker has begun its permitted work                       |
| Blocked                 | A concrete dependency/decision prevents the remaining assigned work    |
| Review                  | Deliverable and local evidence are ready for the assigned review       |
| Done                    | Required evidence exists, PR merged and handoff recorded               |

These states are internal. They do not update Canny statuses or announce releases.

## Shared changes and integration

The integration owner controls root AGENTS, decisions/registry, manifests and
lockfile, global tooling, API composition, common contract exports, migration
ordering and canonical tokens. Domain workers own their assigned spec/feature
paths. Ask the integration owner to allocate a needed shared change; do not
silently enlarge a lane or edit a file another worker owns.

Define consumed/produced interfaces and contract versions before parallel code
work. An upstream breaking change first gets a contract decision and consumer
impact list. Integrate dependency changes before dependent PRs and rerun affected
real-boundary acceptance. Mocks may support protocol failure cases but cannot be
the only proof that the integrated feature works.

## Handoff requirements

Use the [task template](tasks/TEMPLATE.md). Include:

- What changed and why, approved inputs/outputs and any accepted assumptions.
- Base/final revisions, PR, exact checks and observed results, device/runtime and
  whether evidence is synthetic, live-provider, simulator or physical-device.
- Remaining limitations and decisions, downstream tasks and shared changes needed.
- Servers/ports/devices/data created and their cleanup or ownership transfer.

Do not claim another worker's tests or reference screenshots as new evidence.
Review the actual diff. Agents do not write/modify unit tests or use TDD.
Commit, push and merge after relevant local checks; Actions usage is exhausted.
Product scaffolding/imports stay behind approved task scope. Public publishing,
paid provider changes, production deployment and distribution need separate scope.

## Recovery

On interruption, record a safe checkpoint and current branch/status without
resetting, stashing or discarding someone else's work. A replacement worker reads
the packet and real Git state before continuing. Never force push a shared branch
or remove a worktree with unpreserved files. Claims, server ownership and evidence
must be reconciled explicitly before reassignment.
