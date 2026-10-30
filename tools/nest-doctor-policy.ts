import path from "node:path";

import { z } from "zod";

const directive = new RegExp(
  ["nestjs", "doctor", "(?:ignore|disable)"].join("-"),
  "iu"
);

// Only additive rules and stricter defaults are allowed. Built-in rules,
// categories, severities, scan coverage, and report surfaces cannot be changed.
const configSchema = z.strictObject({
  customRulesDir: z.string().min(1).optional(),
  minScore: z.literal(100).optional(),
  telemetry: z.literal(false).optional(),
});

const configFiles = new Set([
  "nestjs-doctor.config.json",
  ".nestjs-doctor.json",
]);

export const assertDoctorPolicy = (file: string, source: string) => {
  if (directive.test(source)) {
    throw new Error(`${file}: doctor suppression directives are forbidden`);
  }

  const name = path.basename(file);

  if (configFiles.has(name)) {
    configSchema.parse(JSON.parse(source));
  } else if (name === "package.json") {
    const manifest = z
      .looseObject({ "nestjs-doctor": z.json().optional() })
      .parse(JSON.parse(source));

    if (manifest["nestjs-doctor"] !== undefined) {
      configSchema.parse(manifest["nestjs-doctor"]);
    }
  }
};

const reportSchema = z.object({
  diagnostics: z.array(
    z.object({
      filePath: z.string(),
      line: z.number().optional(),
      message: z.string(),
      rule: z.string(),
      severity: z.enum(["error", "warning", "info"]),
    })
  ),
  project: z.object({
    fileCount: z.number().int().positive(),
    moduleCount: z.number().int().positive(),
  }),
  ruleErrors: z.array(z.json()),
  score: z.object({ value: z.number() }),
  summary: z.object({ total: z.number().int().nonnegative() }),
});

export const assertCleanDoctorReport = (source: string) => {
  const report = reportSchema.parse(JSON.parse(source));

  if (report.ruleErrors.length > 0) {
    throw new Error(
      `Doctor rules failed: ${JSON.stringify(report.ruleErrors)}`
    );
  }

  if (
    report.score.value !== 100 ||
    report.diagnostics.length > 0 ||
    report.summary.total !== 0
  ) {
    const findings = report.diagnostics.map(
      (finding) =>
        `${finding.filePath}:${finding.line ?? 1}: [${finding.severity}] ${finding.rule}: ${finding.message}`
    );

    throw new Error(
      `Doctor requires 100/100 and zero findings.\n${findings.join("\n")}`
    );
  }

  return report;
};
