import nodePath from "node:path";

import ts from "typescript";

import type { FeaturePolicy, SourceRole } from "./architecture-policy.ts";

export interface ArchitectureViolation {
  rule: string;
  file: string;
  message: string;
}

interface OwnedFile {
  feature: FeaturePolicy;
  role: SourceRole;
  publicNames: readonly string[] | undefined;
}

interface ImportReference {
  specifier: string;
  bindings: readonly ts.Node[];
  namespace: boolean;
}

interface ArchitectureInput {
  root: string;
  program: ts.Program;
  features: readonly FeaturePolicy[];
  resolutionHost?: ts.ModuleResolutionHost;
}

const PLAIN_ROLES = new Set<SourceRole>([
  "message",
  "model",
  "operation",
  "port",
  "query",
  "read-port",
]);

const READ_ROLES = new Set<SourceRole>([
  "message",
  "model",
  "query",
  "read-port",
]);

const BOUNDARY_ROLES = new Set<SourceRole>(["transport", "handler"]);

const BUSINESS_IMPORTS: Partial<Record<SourceRole, ReadonlySet<SourceRole>>> = {
  operation: PLAIN_ROLES,
  query: READ_ROLES,
};

const CONTRACT_ROLES = new Set<SourceRole>([
  "message",
  "model",
  "port",
  "read-port",
]);

const ADAPTER_ROLES = new Set<SourceRole>([
  "integration",
  "repository",
  "wiring",
]);

const TRANSPORT_PACKAGES = [
  "@gloups/contracts",
  "@nestjs/common",
  "@nestjs/cqrs",
  "@nestjs/platform-node",
  "zod",
];

const BOUNDARY_PACKAGES: Partial<Record<SourceRole, readonly string[]>> = {
  handler: ["@nestjs/common", "@nestjs/cqrs"],
  transport: TRANSPORT_PACKAGES,
};

const SDK_PACKAGES = [
  "@better-auth",
  "better-auth",
  "drizzle-kit",
  "drizzle-orm",
  "postgres",
];

const packageMatches = (name: string, prefix: string) =>
  name === prefix || name.startsWith(`${prefix}/`);

const cycles = (graph: ReadonlyMap<string, ReadonlySet<string>>) => {
  const complete = new Set<string>();
  const active: string[] = [];
  const found: string[][] = [];

  const visit = (name: string) => {
    const index = active.indexOf(name);

    if (index !== -1) {
      found.push([...active.slice(index), name]);

      return;
    }

    if (complete.has(name)) {
      return;
    }

    active.push(name);

    for (const dependency of graph.get(name) ?? []) {
      visit(dependency);
    }

    active.pop();
    complete.add(name);
  };

  for (const name of graph.keys()) {
    visit(name);
  }

  return found;
};

const property = (object: ts.ObjectLiteralExpression, name: string) =>
  object.properties.find(
    (entry): entry is ts.PropertyAssignment =>
      ts.isPropertyAssignment(entry) &&
      entry.name.getText().replaceAll('"', "").replaceAll("'", "") === name
  );

const returns = (declaration: ts.Node): ts.Expression[] => {
  const output: ts.Expression[] = [];

  if (
    !(
      ts.isFunctionDeclaration(declaration) ||
      ts.isFunctionExpression(declaration) ||
      ts.isArrowFunction(declaration) ||
      ts.isMethodDeclaration(declaration)
    ) ||
    !declaration.body
  ) {
    return output;
  }

  const { body } = declaration;

  if (!ts.isBlock(body)) {
    return [body];
  }

  const visit = (node: ts.Node) => {
    if (ts.isFunctionLike(node) || ts.isClassDeclaration(node)) {
      return;
    }

    if (ts.isReturnStatement(node) && node.expression) {
      output.push(node.expression);
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(body, visit);

  return output;
};

const createOwnership = (
  root: string,
  program: ts.Program,
  features: readonly FeaturePolicy[],
  report: (rule: string, file: string, message: string) => void
) => {
  const ownership = new Map<string, OwnedFile>();

  for (const feature of features) {
    for (const [file, role] of Object.entries(feature.files)) {
      const absolute = nodePath.resolve(root, feature.root, file);

      if (ownership.has(absolute)) {
        report("policy", absolute, "File belongs to more than one feature");
      }

      ownership.set(absolute, {
        feature,
        publicNames: feature.publicFiles[file],
        role,
      });

      if (!program.getSourceFile(absolute)) {
        report(
          "policy",
          absolute,
          "Registered file does not exist in the source program"
        );
      }
    }

    for (const file of Object.keys(feature.publicFiles)) {
      if (!feature.files[file]) {
        report(
          "policy",
          nodePath.resolve(root, feature.root, file),
          "Public entry point has no registered responsibility"
        );
      }
    }
  }

  return ownership;
};

const importEqualsReference = (node: ts.Node): ImportReference | undefined => {
  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference) &&
    node.moduleReference.expression &&
    ts.isStringLiteral(node.moduleReference.expression)
  ) {
    return {
      bindings: [node.name],
      namespace: true,
      specifier: node.moduleReference.expression.text,
    };
  }

  return undefined;
};

const staticImport = (node: ts.Node): ImportReference | undefined => {
  if (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    const clause = node.importClause;
    const named = clause?.namedBindings;
    const bindings: ts.Node[] = clause?.name ? [clause.name] : [];

    if (named && ts.isNamedImports(named)) {
      bindings.push(...named.elements.map((element) => element.name));
    }

    return {
      bindings,
      namespace: !!named && ts.isNamespaceImport(named),
      specifier: node.moduleSpecifier.text,
    };
  }

  if (
    ts.isExportDeclaration(node) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    const clause = node.exportClause;

    return {
      bindings:
        clause && ts.isNamedExports(clause)
          ? clause.elements.map((element) => element.name)
          : [],
      namespace: !clause || ts.isNamespaceExport(clause),
      specifier: node.moduleSpecifier.text,
    };
  }

  if (
    ts.isImportTypeNode(node) &&
    ts.isLiteralTypeNode(node.argument) &&
    ts.isStringLiteral(node.argument.literal)
  ) {
    return {
      bindings: node.qualifier ? [node.qualifier] : [],
      namespace: !node.qualifier,
      specifier: node.argument.literal.text,
    };
  }

  return importEqualsReference(node);
};

/** Checks owned source and Nest metadata without loading or executing application code. */
export const checkArchitecture = ({
  root,
  program,
  features,
  resolutionHost = ts.sys,
}: ArchitectureInput): ArchitectureViolation[] => {
  const checker = program.getTypeChecker();

  const violations: ArchitectureViolation[] = [];
  const sourceGraph = new Map<string, Set<string>>();
  const moduleGraph = new Map<string, Set<string>>();
  const moduleClasses = new Map<ts.ClassDeclaration, string>();
  const callSites: ts.CallExpression[] = [];

  const files = program
    .getSourceFiles()
    .filter(
      (file) =>
        !file.isDeclarationFile &&
        nodePath.relative(root, file.fileName).split(nodePath.sep)[0] !==
          ".." &&
        !nodePath.isAbsolute(nodePath.relative(root, file.fileName))
    );

  const report = (rule: string, file: string, message: string) => {
    violations.push({ file: nodePath.relative(root, file), message, rule });
  };

  const ownership = createOwnership(root, program, features, report);

  const symbolAt = (node: ts.Node): ts.Symbol | undefined => {
    const symbol = checker.getSymbolAtLocation(node);

    // oxlint-disable-next-line no-bitwise -- TypeScript represents symbol categories as a bit mask.
    return symbol && symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  };

  const nestDecorator = (node: ts.ClassDeclaration, name: string) =>
    (ts.getDecorators(node) ?? []).find((decorator) => {
      const { expression } = decorator;

      return (
        ts.isCallExpression(expression) &&
        symbolAt(expression.expression)?.getName() === name
      );
    });

  for (const file of files) {
    const owner = ownership.get(nodePath.resolve(file.fileName));

    if (!owner) {
      report(
        "unclassified-source",
        file.fileName,
        "Register the owning feature and responsibility"
      );
    }

    sourceGraph.set(file.fileName, new Set());

    const collect = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        callSites.push(node);
      }

      if (ts.isClassDeclaration(node) && nestDecorator(node, "Module")) {
        const key = `${nodePath.relative(root, file.fileName)}#${node.name?.text ?? "anonymous"}`;
        moduleClasses.set(node, key);
        moduleGraph.set(key, new Set());

        if (owner?.role !== "wiring") {
          report(
            "module-wiring",
            file.fileName,
            "Nest modules belong in approved feature wiring"
          );
        }

        if (!owner?.feature.providerExports[node.name?.text ?? ""]) {
          report(
            "provider-export",
            file.fileName,
            "Declare the module's permitted provider exports"
          );
        }

        if (nestDecorator(node, "Global")) {
          report(
            "global-module",
            file.fileName,
            "Feature modules must use explicit imports and narrow exports"
          );
        }
      }

      ts.forEachChild(node, collect);
    };

    collect(file);
  }

  const checkBusinessImport = (
    owner: OwnedFile,
    target: OwnedFile,
    file: ts.SourceFile,
    reference: ImportReference
  ) => {
    if (!PLAIN_ROLES.has(owner.role)) {
      return;
    }

    const permitted = BUSINESS_IMPORTS[owner.role] ?? CONTRACT_ROLES;

    if (target.role !== "contract") {
      if (!permitted.has(target.role)) {
        report(
          "plain-dependency",
          file.fileName,
          `Plain ${owner.role} cannot depend on ${target.role}: ${reference.specifier}`
        );
      }

      return;
    }

    if (reference.namespace || reference.bindings.length === 0) {
      report(
        "plain-dependency",
        file.fileName,
        "Plain code must name the business contracts it consumes"
      );
    }

    for (const binding of reference.bindings) {
      const declarations = symbolAt(binding)?.declarations ?? [];

      if (
        declarations.length === 0 ||
        declarations.some((declaration) => {
          const origin = ownership.get(
            nodePath.resolve(declaration.getSourceFile().fileName)
          );

          return !origin || !permitted.has(origin.role);
        })
      ) {
        report(
          "plain-dependency",
          file.fileName,
          `Public symbol ${binding.getText()} exposes a framework or adapter dependency`
        );
      }
    }
  };

  const checkExternalImport = (
    owner: OwnedFile,
    file: ts.SourceFile,
    reference: ImportReference
  ) => {
    if (reference.specifier.startsWith(".")) {
      report(
        "unresolved-import",
        file.fileName,
        `Unregistered local dependency ${reference.specifier}`
      );

      return;
    }

    if (PLAIN_ROLES.has(owner.role)) {
      report(
        "plain-dependency",
        file.fileName,
        `Plain business code cannot import ${reference.specifier}`
      );

      return;
    }

    if (ADAPTER_ROLES.has(owner.role)) {
      return;
    }

    const sdk = SDK_PACKAGES.some((prefix) =>
      packageMatches(reference.specifier, prefix)
    );

    const allowed = BOUNDARY_PACKAGES[owner.role] ?? [
      "zod",
      "@gloups/contracts",
    ];

    if (
      sdk ||
      !(
        (owner.role !== "handler" && reference.specifier.startsWith("node:")) ||
        allowed.some((prefix) => packageMatches(reference.specifier, prefix))
      )
    ) {
      report(
        "adapter-access",
        file.fileName,
        `Provider access is restricted to repositories, integrations and approved wiring: ${reference.specifier}`
      );
    }
  };

  const checkImport = (file: ts.SourceFile, reference: ImportReference) => {
    const owner = ownership.get(nodePath.resolve(file.fileName));

    if (!owner) {
      return;
    }

    const resolved = ts.resolveModuleName(
      reference.specifier,
      file.fileName,
      program.getCompilerOptions(),
      resolutionHost
    ).resolvedModule;

    const targetFile = resolved && nodePath.resolve(resolved.resolvedFileName);
    const target = targetFile && ownership.get(targetFile);

    if (targetFile && sourceGraph.has(targetFile)) {
      sourceGraph.get(file.fileName)?.add(targetFile);
    }

    if (!target) {
      checkExternalImport(owner, file, reference);

      return;
    }

    if (owner.feature.name !== target.feature.name && !target.publicNames) {
      report(
        "private-import",
        file.fileName,
        `Use ${target.feature.name}'s explicit public contract instead of ${reference.specifier}`
      );
    }

    if (
      BOUNDARY_ROLES.has(owner.role) &&
      ["integration", "repository", "wiring", "handler"].includes(target.role)
    ) {
      report(
        "adapter-access",
        file.fileName,
        `Controllers and CQRS handlers must call business operations instead of ${reference.specifier}`
      );
    }

    if (BOUNDARY_ROLES.has(owner.role) && target.role === "contract") {
      const adapterSymbols = reference.bindings.some((binding) =>
        (symbolAt(binding)?.declarations ?? []).some((declaration) => {
          const origin = ownership.get(
            nodePath.resolve(declaration.getSourceFile().fileName)
          );

          return (
            !origin ||
            ADAPTER_ROLES.has(origin.role) ||
            origin.role === "handler"
          );
        })
      );

      if (adapterSymbols || reference.namespace) {
        report(
          "adapter-access",
          file.fileName,
          "Transport must name business contracts without exposing adapters through a barrel"
        );
      }
    }

    checkBusinessImport(owner, target, file, reference);
  };

  for (const file of files) {
    const owner = ownership.get(nodePath.resolve(file.fileName));

    const checkLoading = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const loading =
          node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require");

        if (loading) {
          const [specifier] = node.arguments;

          if (!specifier || !ts.isStringLiteral(specifier)) {
            report(
              "dynamic-import",
              file.fileName,
              "Module loading must be statically reviewable"
            );
          } else {
            checkImport(file, {
              bindings: [],
              namespace: true,
              specifier: specifier.text,
            });
          }

          if (owner && PLAIN_ROLES.has(owner.role)) {
            report(
              "plain-dependency",
              file.fileName,
              "Business contracts must use static imports"
            );
          }
        }
      }
    };

    const checkTransportGlobal = (node: ts.Node) => {
      if (
        !owner ||
        !PLAIN_ROLES.has(owner.role) ||
        !ts.isIdentifier(node) ||
        !["fetch", "Request", "Response", "Headers"].includes(node.text)
      ) {
        return;
      }

      const externalGlobal = (symbolAt(node)?.declarations ?? []).some(
        (declaration) =>
          declaration.getSourceFile().isDeclarationFile &&
          !ownership.has(nodePath.resolve(declaration.getSourceFile().fileName))
      );

      if (externalGlobal) {
        report(
          "plain-dependency",
          file.fileName,
          "Transport values belong behind an owned business port"
        );
      }
    };

    const visit = (node: ts.Node) => {
      const reference = staticImport(node);

      if (reference) {
        checkImport(file, reference);
      }

      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        reference?.namespace &&
        owner?.publicNames
      ) {
        report(
          "public-contract",
          file.fileName,
          "Public contracts require explicit named exports"
        );
      }

      checkLoading(node);
      checkTransportGlobal(node);
      ts.forEachChild(node, visit);
    };

    visit(file);

    if (owner?.publicNames) {
      const symbol = checker.getSymbolAtLocation(file);

      const names = symbol
        ? checker.getExportsOfModule(symbol).map((entry) => entry.getName())
        : [];

      if (
        names.toSorted().join(",") !== owner.publicNames.toSorted().join(",")
      ) {
        report(
          "public-contract",
          file.fileName,
          `Public exports must match the reviewed contract: ${owner.publicNames.join(", ")}`
        );
      }
    }
  }

  const resolveModules = (
    expression: ts.Expression,
    seen = new Set<ts.Node>()
  ): Set<string> => {
    if (seen.has(expression)) {
      return new Set();
    }

    const nextSeen = new Set([...seen, expression]);
    const output = new Set<string>();

    const add = (value: ts.Expression) => {
      for (const name of resolveModules(value, nextSeen)) {
        output.add(name);
      }
    };

    if (
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isSatisfiesExpression(expression)
    ) {
      add(expression.expression);
    }

    if (ts.isObjectLiteralExpression(expression)) {
      const module = property(expression, "module");

      if (module) {
        add(module.initializer);
      }
    }

    if (ts.isArrowFunction(expression) && !ts.isBlock(expression.body)) {
      add(expression.body);
    }

    const addCall = (call: ts.CallExpression) => {
      if (ts.isPropertyAccessExpression(call.expression)) {
        add(call.expression.expression);
      }

      if (symbolAt(call.expression)?.getName() === "forwardRef") {
        for (const argument of call.arguments) {
          add(argument);
        }
      }

      const declaration = checker.getResolvedSignature(call)?.declaration;

      if (declaration) {
        for (const value of returns(declaration)) {
          add(value);
        }
      }
    };

    if (ts.isCallExpression(expression)) {
      addCall(expression);
    }

    const addDeclaration = (declaration: ts.Declaration) => {
      if (ts.isClassDeclaration(declaration)) {
        const key = moduleClasses.get(declaration);

        if (key) {
          output.add(key);
        } else {
          const owner = ownership.get(
            nodePath.resolve(expression.getSourceFile().fileName)
          );

          const source = declaration
            .getSourceFile()
            .fileName.replaceAll(nodePath.sep, "/");

          if (owner?.role === "wiring") {
            for (const [dependency, names] of Object.entries(
              owner.feature.frameworkModules ?? {}
            )) {
              if (
                names.includes(declaration.name?.text ?? "") &&
                source.includes(`/node_modules/${dependency}/`)
              ) {
                output.add(`framework:${dependency}#${declaration.name?.text}`);
              }
            }
          }
        }
      } else if (
        (ts.isVariableDeclaration(declaration) ||
          ts.isPropertyAssignment(declaration)) &&
        declaration.initializer
      ) {
        add(declaration.initializer);
      } else if (ts.isParameter(declaration)) {
        const index = declaration.parent.parameters.indexOf(declaration);

        for (const call of callSites) {
          if (
            checker.getResolvedSignature(call)?.declaration ===
            declaration.parent
          ) {
            const argument = call.arguments[index];

            if (argument) {
              add(argument);
            }
          }
        }
      }
    };

    for (const declaration of symbolAt(expression)?.declarations ?? []) {
      addDeclaration(declaration);
    }

    return output;
  };

  const inspectMetadata = (
    module: string,
    file: ts.SourceFile,
    metadata: ts.ObjectLiteralExpression
  ) => {
    const owner = ownership.get(nodePath.resolve(file.fileName));
    const name = module.split("#").at(-1) ?? "";

    if (
      metadata.properties.some(
        (entry) =>
          !ts.isPropertyAssignment(entry) ||
          ts.isComputedPropertyName(entry.name)
      )
    ) {
      report(
        "module-import",
        file.fileName,
        "Nest metadata must use explicit named properties"
      );
    }

    const imports = property(metadata, "imports");

    if (imports) {
      if (ts.isArrayLiteralExpression(imports.initializer)) {
        for (const expression of imports.initializer.elements) {
          const dependencies = resolveModules(expression);

          if (dependencies.size === 0) {
            report(
              "module-import",
              file.fileName,
              `Cannot resolve Nest module dependency ${expression.getText()}`
            );
          }

          for (const dependency of dependencies) {
            moduleGraph.get(module)?.add(dependency);
          }
        }
      } else {
        report(
          "module-import",
          file.fileName,
          "Nest imports must be explicit, statically reviewable arrays"
        );
      }
    }

    const exports = property(metadata, "exports");

    if (!exports) {
      return;
    }

    if (!ts.isArrayLiteralExpression(exports.initializer)) {
      report(
        "provider-export",
        file.fileName,
        "Nest exports must be an explicit list of approved provider tokens"
      );

      return;
    }

    for (const expression of exports.initializer.elements) {
      const exportedName = ts.isStringLiteral(expression)
        ? expression.text
        : symbolAt(expression)?.getName();

      if (
        !exportedName ||
        !owner?.feature.providerExports[name]?.includes(exportedName) ||
        resolveModules(expression).size > 0
      ) {
        report(
          "provider-export",
          file.fileName,
          `Unapproved or broad Nest export ${expression.getText()}`
        );
      }
    }
  };

  for (const [declaration, module] of moduleClasses) {
    const decorator = nestDecorator(declaration, "Module");

    if (decorator && ts.isCallExpression(decorator.expression)) {
      const [metadata] = decorator.expression.arguments;

      if (metadata && ts.isObjectLiteralExpression(metadata)) {
        inspectMetadata(module, declaration.getSourceFile(), metadata);
      } else {
        report(
          "module-import",
          declaration.getSourceFile().fileName,
          "Nest module metadata must be explicit"
        );
      }
    }
  }

  for (const file of files) {
    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node) && property(node, "module")) {
        for (const module of resolveModules(node)) {
          inspectMetadata(module, file, node);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(file);
  }

  for (const cycle of cycles(sourceGraph)) {
    report(
      "source-cycle",
      cycle[0] ?? root,
      cycle.map((name) => nodePath.relative(root, name)).join(" -> ")
    );
  }

  for (const cycle of cycles(moduleGraph)) {
    violations.push({
      file: "Nest modules",
      message: cycle.join(" -> "),
      rule: "module-cycle",
    });
  }

  return violations.toSorted((left, right) =>
    `${left.file}:${left.rule}:${left.message}`.localeCompare(
      `${right.file}:${right.rule}:${right.message}`
    )
  );
};
