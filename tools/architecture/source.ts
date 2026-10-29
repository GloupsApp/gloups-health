import { existsSync, realpathSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

export interface Binding {
  file: string | undefined;
  name: string;
  specifier: string;
}

export interface Source {
  ast: ts.SourceFile;
  bindings: Map<string, Binding>;
  edges: Set<string>;
  file: string;
  imports: Map<string, string | undefined>;
}

export type Report = (source: Source, node: ts.Node, message: string) => void;

export const canonical = (file: string): string => realpathSync(file);

export const relative = (root: string, file: string): string =>
  path.relative(root, file).split(path.sep).join("/");

export const loadSources = (root: string): Map<string, Source> => {
  const sources = new Map<string, Source>();

  if (!existsSync(root)) {
    return sources;
  }

  for (const file of ts.sys.readDirectory(
    root,
    [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"],
    ["**/*.d.ts", "**/node_modules/**", "**/dist/**"]
  )) {
    const text = ts.sys.readFile(file);

    if (text === undefined) {
      throw new Error("Cannot read architecture source.");
    }

    const resolved = canonical(file);
    sources.set(resolved, {
      ast: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true),
      bindings: new Map(),
      edges: new Set(),
      file: resolved,
      imports: new Map(),
    });
  }

  return sources;
};

export const compilerOptions = (root: string): ts.CompilerOptions => {
  const config = ts.findConfigFile(root, ts.sys.fileExists);

  if (!config) {
    throw new Error("Architecture checking requires a tsconfig.json.");
  }

  const read = ts.readConfigFile(config, ts.sys.readFile);

  if (read.error) {
    throw new Error("Cannot read architecture TypeScript configuration.");
  }

  const parsed = ts.parseJsonConfigFileContent(
    read.config,
    ts.sys,
    path.dirname(config)
  );

  if (parsed.errors.some((error) => error.code !== 18_003)) {
    throw new Error("Invalid architecture TypeScript configuration.");
  }

  return parsed.options;
};

const bindImports = (
  source: Source,
  node: ts.ImportDeclaration,
  binding: Binding
): void => {
  const clause = node.importClause;

  if (clause?.name) {
    source.bindings.set(clause.name.text, { ...binding, name: "default" });
  }

  const named = clause?.namedBindings;

  if (!named) {
    return;
  }

  if (ts.isNamespaceImport(named)) {
    source.bindings.set(named.name.text, { ...binding, name: "*" });

    return;
  }

  for (const item of named.elements) {
    source.bindings.set(item.name.text, {
      ...binding,
      name: (item.propertyName ?? item.name).text,
    });
  }
};

/** Includes type edges, re-exports, import types and literal dynamic imports. */
export const connect = (
  source: Source,
  options: ts.CompilerOptions,
  report: Report
): void => {
  const resolve = (specifier: string, node: ts.Node): Binding => {
    const target = ts.resolveModuleName(
      specifier,
      source.file,
      options,
      ts.sys
    ).resolvedModule;

    const file = target ? canonical(target.resolvedFileName) : undefined;
    source.imports.set(specifier, file);

    if (file) {
      source.edges.add(file);
    } else if (specifier.startsWith(".")) {
      report(source, node, "Unresolved local import.");
    }

    return { file, name: "", specifier };
  };

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const binding = resolve(node.moduleSpecifier.text, node);

      if (ts.isImportDeclaration(node)) {
        bindImports(source, node, binding);
      }
    }

    if (
      ts.isExportDeclaration(node) &&
      (!node.exportClause || !ts.isNamedExports(node.exportClause))
    ) {
      report(
        source,
        node,
        "Wildcard re-exports hide the public surface; name exports explicitly."
      );
    }

    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      const [argument] = node.arguments;

      if (argument && ts.isStringLiteralLike(argument)) {
        resolve(argument.text, node);
      } else {
        report(
          source,
          node,
          "Computed module loading cannot be checked statically."
        );
      }
    }

    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const { literal } = node.argument;

      if (ts.isStringLiteral(literal)) {
        resolve(literal.text, node);
      }
    }

    if (ts.isImportEqualsDeclaration(node)) {
      report(
        source,
        node,
        "Use ESM imports so dependency and export bindings remain explicit."
      );
    }

    ts.forEachChild(node, visit);
  };

  visit(source.ast);
};

/** Report back edges in a directed graph, including self-imports. */
export const cycles = (graph: Map<string, Set<string>>): string[][] => {
  const active = new Set<string>();
  const done = new Set<string>();
  const stack: string[] = [];
  const found: string[][] = [];

  const visit = (node: string): void => {
    if (active.has(node)) {
      found.push([...stack.slice(stack.indexOf(node)), node]);

      return;
    }

    if (done.has(node)) {
      return;
    }

    active.add(node);
    stack.push(node);

    for (const target of graph.get(node) ?? []) {
      if (graph.has(target)) {
        visit(target);
      }
    }

    stack.pop();
    active.delete(node);
    done.add(node);
  };

  for (const node of graph.keys()) {
    visit(node);
  }

  return found;
};
