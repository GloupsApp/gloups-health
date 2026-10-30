---
name: nestjs-doctor
description: Use after writing or changing NestJS code, before committing, when a nestjs-doctor check fails in CI, or when the user asks to scan, audit, review, or clean up a Nest project, or mentions circular modules, unused providers, a missing guard, an ORM leaking into a controller, or a slow boot. Runs a deterministic scan over security, correctness, architecture, performance, and database schema, then fixes what it finds.
allowed-tools: Bash, Read, Edit, Glob, Grep, Write
---

# nestjs-doctor

> v0.9.10

The deterministic NestJS devtool that catches AI mistakes.

Rules over security, correctness, architecture, performance, and database
schema, scored 0-100. No model at scan time and nothing about your code leaves
the machine, so the same
commit scores the same on a laptop and in CI.

## After changing NestJS code

Gloups requires a full-project scan with the pinned tool, without consulting Git history:

```bash
bun run check:nest
```

Run this gate before committing. The pre-commit hook and CI use the same command.
It checks all current repository files for suppression directives and disabling
configuration, then runs every built-in rule with full scope and telemetry disabled.
The gate requires 100/100, zero diagnostics at every severity (including report-only
info), and no scanner or rule failures. A score of 100 alone is insufficient.

## Fixing a finding

Every diagnostic carries a rule ID and help text. Fix its cause in the smallest
appropriate place, rerun the full gate, and verify the behavior with the relevant
acceptance checks. Schema findings apply to real database entities, so schema
changes need reviewed migrations and persistence checks.

## Project policy: no diagnostic bypasses

Do not add inline or file suppressions, disable rules or categories, narrow file
coverage, or change diagnostic surfaces. This project policy overrides generic
upstream advice about suppressing false positives. Fix legitimate design issues;
if a finding is wrong, investigate the analyzer and report the limitation plainly.
Do not add dummy consumers or meaningless guards just to satisfy the scan.

Configuration may only add custom rules, disable telemetry, or require a perfect
score. The gate validates every supported JSON configuration location and every
package manifest. Custom rule load errors also fail the check.

## Machine-readable output

For investigation, use the pinned local CLI without narrowing the report:

```bash
node node_modules/nestjs-doctor/dist/cli/index.mjs . --scope full --no-telemetry --format json --blocking none
```

JSON output does not fail on findings by itself. `bun run check:nest` validates the
complete output and enforces this project's stricter policy.

## Continuous integration

`.github/workflows/nestjs-doctor.yml` installs frozen dependencies and runs the
same gate on pull requests and pushes to main. It uses a shallow checkout and
never compares commits. Do not replace it with an advisory or changed-files scan.

## A slow boot

Construction times need a real boot, which a scan never performs. Use the
`nestjs-boot-trace` skill.
