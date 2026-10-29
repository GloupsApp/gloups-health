import ts from "typescript";

import type { Binding, Report, Source } from "./source";
import { relative } from "./source";

// Private adapter exports serve only these consumers inside their owning context.
// Feature roots never use these exceptions; they expose application/public-api.ts.
const privateExports = new Map<string, readonly string[]>([
  [
    "platform/configuration/api-configuration.module.ts",
    ["config.ts#API_CONFIG"],
  ],
  [
    "platform/persistence/database.module.ts",
    ["@nestjs/drizzle#DrizzleModule"],
  ],
  [
    "modules/identity-access/composition/identity-persistence.module.ts",
    ["modules/identity-access/infrastructure/persistence/database.ts#DATABASE"],
  ],
  [
    "modules/identity-access/composition/authentication.module.ts",
    [
      "modules/identity-access/infrastructure/auth/auth.ts#AUTH",
      "modules/identity-access/infrastructure/auth/better-auth.gateway.ts#BetterAuthGateway",
    ],
  ],
  [
    "modules/identity-access/composition/identity-http-policies.module.ts",
    [
      "modules/identity-access/presentation/trusted-origin.guard.ts#TrustedOriginGuard",
      "modules/identity-access/presentation/request-budget.guard.ts#RequestBudgetGuard",
    ],
  ],
]);

const dynamicModules = new Map<string, readonly string[]>([
  [
    "platform/configuration/api-configuration.module.ts",
    ["@nestjs/config#ConfigModule.forRoot"],
  ],
  [
    "platform/persistence/database.module.ts",
    ["@nestjs/drizzle#DrizzleModule.forRootAsync"],
  ],
]);

const propertyName = (node: ts.PropertyName): string | undefined =>
  ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : undefined;

const imported = (source: Source, node: ts.Expression): Binding | undefined => {
  if (ts.isIdentifier(node)) {
    return source.bindings.get(node.text);
  }

  return undefined;
};

const metadataOf = (
  source: Source,
  declaration: ts.ClassDeclaration,
  report: Report
): ts.ObjectLiteralExpression | undefined => {
  const decorators = ts.canHaveDecorators(declaration)
    ? (ts.getDecorators(declaration) ?? [])
    : [];

  const decorator = decorators.find((item) => {
    if (!ts.isCallExpression(item.expression)) {
      return false;
    }

    const binding = imported(source, item.expression.expression);

    return binding?.specifier === "@nestjs/common" && binding.name === "Module";
  });

  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    if (source.file.endsWith(".module.ts")) {
      report(
        source,
        declaration,
        "Module files require a direct named Nest Module decorator."
      );
    }

    return undefined;
  }

  const [metadata] = decorator.expression.arguments;

  if (
    !declaration.name ||
    !metadata ||
    !ts.isObjectLiteralExpression(metadata)
  ) {
    report(
      source,
      declaration,
      "Nest module metadata must be a named class and an inline object."
    );

    return undefined;
  }

  return metadata;
};

const inspectExport = (
  source: Source,
  element: ts.Expression,
  apiRoot: string,
  report: Report,
  providers: Set<string>
): void => {
  const binding = imported(source, element);
  const ownPath = relative(apiRoot, source.file);

  if (!binding) {
    report(
      source,
      element,
      "Export imported application providers explicitly; no objects, spreads or module re-exports."
    );

    return;
  }

  const target = binding.file?.startsWith(`${apiRoot}/`)
    ? relative(apiRoot, binding.file)
    : binding.specifier;

  const [first, context] = ownPath.split("/");

  const isRoot =
    first === "modules" &&
    ownPath === `modules/${context}/${context}.module.ts`;

  const application =
    first === "modules" && target.startsWith(`modules/${context}/application/`);

  const allowed = isRoot
    ? target === `modules/${context}/application/public-api.ts`
    : application ||
      privateExports.get(ownPath)?.includes(`${target}#${binding.name}`);

  const libraryModule =
    target === "@nestjs/drizzle" && binding.name === "DrizzleModule";

  if (
    ts.isIdentifier(element) &&
    !providers.has(element.text) &&
    !libraryModule
  ) {
    report(
      source,
      element,
      "Exported providers must be registered locally; expose a public token rather than re-exporting a private module."
    );
  }

  if (!allowed) {
    report(
      source,
      element,
      "Module exports must be owning application providers or reviewed private adapter tokens; never re-export internal modules."
    );
  }
};

const registeredProviders = (
  metadata: ts.ObjectLiteralExpression
): Set<string> => {
  const providers = new Set<string>();

  for (const property of metadata.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      propertyName(property.name) !== "providers" ||
      !ts.isArrayLiteralExpression(property.initializer)
    ) {
      continue;
    }

    for (const element of property.initializer.elements) {
      if (ts.isIdentifier(element)) {
        providers.add(element.text);
      } else if (ts.isObjectLiteralExpression(element)) {
        for (const entry of element.properties) {
          if (
            ts.isPropertyAssignment(entry) &&
            propertyName(entry.name) === "provide" &&
            ts.isIdentifier(entry.initializer)
          ) {
            providers.add(entry.initializer.text);
          }
        }
      }
    }
  }

  return providers;
};

const inspectImport = (
  source: Source,
  element: ts.Expression,
  apiRoot: string,
  report: Report,
  dependencies: Set<string>
): void => {
  const binding = imported(source, element);

  if (binding?.file) {
    dependencies.add(`${binding.file}#${binding.name}`);
  } else if (ts.isIdentifier(element)) {
    dependencies.add(`${source.file}#${element.text}`);
  } else if (
    ts.isCallExpression(element) &&
    ts.isPropertyAccessExpression(element.expression)
  ) {
    const owner = imported(source, element.expression.expression);
    const identity = `${owner?.specifier}#${owner?.name}.${element.expression.name.text}`;

    if (
      !dynamicModules.get(relative(apiRoot, source.file))?.includes(identity)
    ) {
      report(
        source,
        element,
        "Dynamic/forward module imports require an explicit platform policy."
      );
    }
  } else {
    report(source, element, "Nest module imports must name modules directly.");
  }
};

const inspectMetadata = (
  source: Source,
  metadata: ts.ObjectLiteralExpression,
  apiRoot: string,
  report: Report,
  dependencies: Set<string>
): void => {
  const providers = registeredProviders(metadata);

  for (const property of metadata.properties) {
    if (!ts.isPropertyAssignment(property)) {
      report(
        source,
        property,
        "Computed or spread Nest metadata hides module boundaries."
      );
      continue;
    }

    const key = propertyName(property.name);

    if (!key) {
      report(
        source,
        property,
        "Computed Nest metadata keys hide module boundaries."
      );
      continue;
    }

    if (key !== "imports" && key !== "exports") {
      continue;
    }

    if (!ts.isArrayLiteralExpression(property.initializer)) {
      report(
        source,
        property,
        "Nest imports and exports must be explicit arrays."
      );
      continue;
    }

    for (const element of property.initializer.elements) {
      if (key === "imports") {
        inspectImport(source, element, apiRoot, report, dependencies);
      } else {
        inspectExport(source, element, apiRoot, report, providers);
      }
    }
  }
};

/** Inspect static Nest metadata without executing any application or SDK code. */
export const inspectModules = (
  source: Source,
  apiRoot: string,
  report: Report,
  graph: Map<string, Set<string>>
): number => {
  let count = 0;

  for (const declaration of source.ast.statements) {
    if (!ts.isClassDeclaration(declaration)) {
      continue;
    }

    const metadata = metadataOf(source, declaration, report);

    if (!metadata) {
      continue;
    }

    count += 1;
    const dependencies = new Set<string>();
    graph.set(`${source.file}#${declaration.name?.text}`, dependencies);
    inspectMetadata(source, metadata, apiRoot, report, dependencies);
  }

  return count;
};
