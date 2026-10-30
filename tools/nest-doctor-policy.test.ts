import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertCleanDoctorReport,
  assertDoctorPolicy,
} from "./nest-doctor-policy.ts";

const cleanReport = {
  diagnostics: [],
  project: { fileCount: 40, moduleCount: 6 },
  ruleErrors: [],
  score: { value: 100 },
  summary: { total: 0 },
};

test("requires an actual clean scan, including report-only diagnostics", () => {
  assert.doesNotThrow(() =>
    assertCleanDoctorReport(JSON.stringify(cleanReport))
  );
  assert.throws(
    () =>
      assertCleanDoctorReport(
        JSON.stringify({
          ...cleanReport,
          diagnostics: [
            {
              filePath: "module.ts",
              message: "Unused export",
              rule: "performance/no-unused-module-exports",
              severity: "info",
            },
          ],
          summary: { total: 1 },
        })
      ),
    /performance\/no-unused-module-exports/u
  );
});

test("fails closed on rule failures, incomplete scans, and invalid output", () => {
  for (const report of [
    { ...cleanReport, ruleErrors: [{ message: "Rule crashed" }] },
    { ...cleanReport, project: { fileCount: 0, moduleCount: 0 } },
    { ...cleanReport, score: { value: 99 } },
    { ...cleanReport, summary: { total: 1 } },
    {},
  ]) {
    assert.throws(() => assertCleanDoctorReport(JSON.stringify(report)));
  }

  assert.throws(() => assertCleanDoctorReport("not JSON"));
});

test("rejects suppression directives in code and documentation", () => {
  for (const suffix of ["ignore-next-line", "ignore-file", "disable"]) {
    const marker = ["nestjs", "doctor", suffix].join("-");
    assert.throws(() =>
      assertDoctorPolicy(
        "module.ts",
        `// ${marker} performance/no-orphan-modules`
      )
    );
    assert.throws(() => assertDoctorPolicy("guide.md", marker));
  }
});

test("rejects configuration bypasses in every supported location", () => {
  for (const config of [
    { rules: { "performance/no-orphan-modules": false } },
    { categories: { performance: false } },
    { exclude: ["apps/api/src"] },
    { include: ["only-one-file.ts"] },
    { minScore: 99 },
  ]) {
    assert.throws(() =>
      assertDoctorPolicy("nestjs-doctor.config.json", JSON.stringify(config))
    );
    assert.throws(() =>
      assertDoctorPolicy("apps/api/.nestjs-doctor.json", JSON.stringify(config))
    );
    assert.throws(() =>
      assertDoctorPolicy(
        "apps/api/package.json",
        JSON.stringify({ "nestjs-doctor": config })
      )
    );
  }
});

test("allows ordinary project files and additive custom rules", () => {
  assert.doesNotThrow(() =>
    assertDoctorPolicy("module.ts", "@Module({ imports: [AccountsModule] })")
  );
  assert.doesNotThrow(() =>
    assertDoctorPolicy("package.json", '{"name":"gloups-health"}')
  );
  assert.doesNotThrow(() =>
    assertDoctorPolicy(
      "nestjs-doctor.config.json",
      JSON.stringify({
        customRulesDir: "./doctor-rules",
        minScore: 100,
        telemetry: false,
      })
    )
  );
});
