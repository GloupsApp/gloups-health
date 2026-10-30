import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

import {
  assertCleanDoctorReport,
  assertDoctorPolicy,
} from "./nest-doctor-policy.ts";

const execute = promisify(execFile);

// Enumerate current files only. No commits, branches, or history are inspected.
const { stdout: inventory } = await execute("git", [
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z",
]);

await Promise.all(
  [...new Set(inventory.split("\0").filter(Boolean))].map(async (file) => {
    assertDoctorPolicy(file, await readFile(file, "utf-8"));
  })
);

const { stdout, stderr } = await execute(
  process.execPath,
  [
    "node_modules/nestjs-doctor/dist/cli/index.mjs",
    ".",
    "--scope",
    "full",
    "--no-telemetry",
    "--format",
    "json",
    "--blocking",
    "none",
  ],
  { maxBuffer: 8 * 1024 * 1024 }
);

// Treat scanner warnings as failures as well, including custom-rule load errors.
if (stderr.trim()) {
  throw new Error(`Doctor did not complete cleanly: ${stderr.trim()}`);
}

const report = assertCleanDoctorReport(stdout);

process.stdout.write(
  `NestJS doctor: 100/100, zero findings or rule failures across ${report.project.fileCount} files and ${report.project.moduleCount} modules. No suppressions.\n`
);
