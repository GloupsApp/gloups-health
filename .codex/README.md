# Agent workflow

Gloups uses the root `AGENTS.md` for shared rules, nested `AGENTS.md` files for directory conventions, and `.codex/agents/*.toml` for role instructions. Only load scopes and role bodies needed for the task. The existing API architecture rules remain in `apps/api/AGENTS.md`.

## Roles

| Role          | Responsibility                                                              | Writes                      | Handoff                                        |
| ------------- | --------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| Primary agent | Own the user request, split work, integrate changes, and deliver the result | Files it owns               | Final result and validation evidence           |
| `planner`     | Map requirements to files, ownership, and checks                            | None                        | `PLAN`, `OWNERSHIP`, `CHECKS`, `BLOCKERS`      |
| `coder`       | Implement a bounded change and relevant tests                               | Assigned files              | `CHANGES`, `CHECKS`, `FOLLOW_UP`, `BLOCKERS`   |
| `tester`      | Run assigned validation on a stable file state                              | Normal build/test artifacts | `RESULTS`, `FAILURES`, `ARTIFACTS`, `BLOCKERS` |
| `reviewer`    | Inspect a stable diff against requirements and conventions                  | None                        | `FINDINGS`, `COVERAGE`, `GAPS`, `BLOCKERS`     |

## Codex setup

Codex discovers project roles from the standalone TOML files in `.codex/agents/`. The project config enables agents and caps concurrent subagents at three, excluding the primary agent. Model and reasoning settings are inherited rather than pinned by this repository.

Start a new Codex session in this checkout after changing configuration or roles. Project configuration must be trusted by the local Codex client. See the [official subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) and [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) for client support and configuration loading.

Role boundaries such as “do not edit” are instructions. Subagents inherit the parent session's permissions; custom role files do not establish separate read-only sandboxes. Keep the parent permission mode appropriate to the task. In clients that cannot select custom roles, include the relevant role's `developer_instructions` explicitly in the delegation message; do not assume a role name loads it.

## Coordination

Use a single agent for small changes. For larger work, delegate independent scopes allowed by the current task and runtime. The primary agent remains responsible for completion; there is no mandatory planner/coder/tester/reviewer pipeline.

1. Inspect the working tree and acceptance criteria. Give each file one writer, including root configuration, architecture policy, contract generation, and generated outputs.
2. Supply each subagent with the handoff below. Do not assume it has the parent's history or decisions.
3. Parallelize independent implementation or exploration. Serialize dependent work, generators, and checks using the same ports or devices.
4. Integrate writers' results, then give the tester and reviewer a stable target. Capture a commit when available plus the current diff and untracked file list; a commit alone does not identify uncommitted edits.
5. Share check results with their commands and tested file state. Rerun only after relevant changes, failures, or incomplete evidence. The primary agent resolves findings and reports remaining blockers honestly.

Subagents return to the primary agent rather than delegating again. Keep live assignments and decisions in messages or ignored `.local/` notes, without credentials or health data.

## Delegation message

```text
ROLE: configured role name; include its instructions if the client cannot select it
TASK: requested outcome and acceptance criteria
CONTEXT: issue/spec, decisions already made, relevant file paths
SCOPE: files to inspect; exact files this agent may edit (or none)
CONSTRAINTS: relevant AGENTS.md paths, compatibility requirements, forbidden actions
DEPENDENCIES: other owners, shared files, services/devices, required ordering
VALIDATION: assigned commands, prior results and their file state, remaining check owner
TARGET: working directory, review base/diff and untracked files when applicable
RETURN: the headings required by the assigned role; report blockers to the primary agent
```

## Validation ownership

Choose checks from `package.json`, affected scope instructions, and `.github/workflows/ci.yml`. The coder owns focused regression checks; one tester or the primary agent owns the remaining gates. A planner proposes checks and a reviewer inspects evidence without running suites.

`bun run check` already includes `check:nest`; `bun run test:api` includes `api:build`. Turbo handles package build dependencies for commands such as `ui:test:web` and `test:mobile:unit`. Account for those when assigning commands to avoid redundant runs. Contract generation writes tracked files, so it must share the contract writer's ownership. Missing prerequisites produce a blocked check, not a passing result.

## Example request

```text
Implement <feature> for Gloups. Use planner to identify the affected scopes and acceptance checks if needed. Delegate independent file sets to coder agents, then have tester run the remaining gates and reviewer inspect the stable diff. Keep one writer per file and one owner per validation command. The primary agent integrates the result and reports any blockers.
```

The layout adapts the [BetterClaw guide](https://www.betterclaw.io/blog/agents-md-multi-agent-best-practices) to Codex's project role format and Gloups' existing package scripts.
