import path from "node:path";

import { inspectModules } from "./modules";
import {
  canonical,
  compilerOptions,
  connect,
  cycles,
  loadSources,
  relative,
} from "./source";
import type { Report } from "./source";

const root = canonical(process.cwd());
const apiRoot = path.join(root, "apps/api/src");
const sources = loadSources(apiRoot);
const options = compilerOptions(path.join(root, "apps/api"));
const errors: string[] = [];
const moduleGraph = new Map<string, Set<string>>();
const sourceGraph = new Map<string, Set<string>>();

const report: Report = (source, node, message) => {
  const position = source.ast.getLineAndCharacterOfPosition(
    node.getStart(source.ast)
  );

  errors.push(
    `${relative(root, source.file)}:${position.line + 1}: ${message}`
  );
};

const location = (file: string) => {
  const name = relative(apiRoot, file);
  const [first, context, layer] = name.split("/");

  return {
    context: first === "modules" ? context : undefined,
    layer: first === "modules" ? layer : undefined,
    name,
  };
};

let modules = 0;

for (const source of sources.values()) {
  connect(source, options, report);
  sourceGraph.set(source.file, source.edges);
  const from = location(source.file);

  if (
    from.context &&
    ![
      "domain",
      "application",
      "infrastructure",
      "presentation",
      "composition",
    ].includes(from.layer ?? "") &&
    from.name !== `modules/${from.context}/${from.context}.module.ts`
  ) {
    report(
      source,
      source.ast,
      "Context files must belong to an explicit layer or the named context module."
    );
  }

  if (from.layer === "domain" || from.layer === "application") {
    for (const target of source.imports.values()) {
      if (!target || !sources.has(target)) {
        report(
          source,
          source.ast,
          "Core dependencies must be resolved local contracts; third-party and Node imports stay outside."
        );
      }
    }
  }

  for (const target of source.edges) {
    const to = location(target);

    if (
      from.context &&
      from.name === `modules/${from.context}/application/public-api.ts` &&
      (to.context !== from.context || to.layer !== "application")
    ) {
      report(
        source,
        source.ast,
        "Public APIs expose owning application contracts, never domain entities, other contexts or adapters."
      );
    }

    if (
      !sources.has(target) &&
      !target.includes(`${path.sep}node_modules${path.sep}`)
    ) {
      report(
        source,
        source.ast,
        "API imports outside its source require an approved shared-contract boundary."
      );
    }

    if (from.context && to.context && from.context !== to.context) {
      const publicContract =
        to.name === `modules/${to.context}/application/public-api.ts`;

      const composition =
        from.layer === "composition" ||
        from.name === `modules/${from.context}/${from.context}.module.ts`;

      const publicModule =
        composition &&
        to.name === `modules/${to.context}/${to.context}.module.ts`;

      if (from.layer === "domain" || !(publicContract || publicModule)) {
        report(
          source,
          source.ast,
          `Cross-context dependency on ${to.name}; use its application public API or composition root.`
        );
      }
    }

    if (from.name.startsWith("platform/") && to.context) {
      report(
        source,
        source.ast,
        "Platform code cannot depend on feature contexts."
      );
    }

    if (from.layer === "domain" && to.layer === "application") {
      report(
        source,
        source.ast,
        "Domain cannot depend on the application layer, including through aliases."
      );
    }

    if (
      from.layer === "infrastructure" &&
      ["presentation", "composition"].includes(to.layer ?? "")
    ) {
      report(
        source,
        source.ast,
        "Infrastructure cannot depend on HTTP or composition, including through aliases."
      );
    }

    if (
      from.layer === "presentation" &&
      /\/infrastructure\/persistence\//u.test(to.name)
    ) {
      report(
        source,
        source.ast,
        "Presentation cannot import persistence, including through aliases."
      );
    }

    if (
      (from.layer === "domain" || from.layer === "application") &&
      sources.has(target) &&
      !["domain", "application"].includes(to.layer ?? "")
    ) {
      report(
        source,
        source.ast,
        "Core imports must resolve to inner contracts, never outer files or barrels."
      );
    }
  }

  modules += inspectModules(source, apiRoot, report, moduleGraph);
}

for (const [label, graph] of [
  ["Source", sourceGraph],
  ["Nest module", moduleGraph],
] as const) {
  for (const cycle of cycles(graph)) {
    errors.push(
      `${label} cycle: ${cycle.map((item) => relative(root, item)).join(" -> ")}`
    );
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Architecture passed: ${sources.size} API sources, ${modules} Nest modules; resolved context boundaries, cycles and exports checked.\n`
  );
}
