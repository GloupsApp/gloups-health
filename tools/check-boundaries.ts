import nodePath from "node:path";

import ts from "typescript";

import { checkArchitecture } from "./architecture-checker.ts";
import { apiFeatures } from "./architecture-policy.ts";

const configPath = nodePath.resolve("apps/api/tsconfig.json");
const configuration = ts.readConfigFile(configPath, ts.sys.readFile);

if (configuration.error) {
  throw new Error("Cannot read the API compiler configuration");
}

const parsed = ts.parseJsonConfigFileContent(
  configuration.config,
  ts.sys,
  nodePath.dirname(configPath)
);

const root = nodePath.resolve("apps/api/src");
const program = ts.createProgram(parsed.fileNames, parsed.options);
const violations = checkArchitecture({ features: apiFeatures, program, root });

if (violations.length > 0) {
  throw new Error(
    `Architecture violations:\n${violations.map((entry) => `${entry.file}: [${entry.rule}] ${entry.message}`).join("\n")}`
  );
}

process.stdout.write(
  "Feature contracts, plain business code, adapter access, and acyclic source/Nest dependencies passed.\n"
);
