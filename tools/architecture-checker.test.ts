import assert from "node:assert/strict";
import nodePath from "node:path";
import { test } from "node:test";

import ts from "typescript";

import { checkArchitecture } from "./architecture-checker.ts";
import type { FeaturePolicy, SourceRole } from "./architecture-policy.ts";

interface FixtureFile {
  code: string;
  role?: SourceRole;
  publicNames?: readonly string[];
  providers?: Readonly<Record<string, readonly string[]>>;
  frameworkModules?: Readonly<Record<string, readonly string[]>>;
}

const base = {
  "accounts/resolve-account.service.ts": {
    code: "import type { Person } from '../identity/public.js'; export const resolveAccount = (person: Person) => person.id;",
    role: "operation",
  },
  "identity/person.ts": {
    code: "export interface Person { id: string }",
    role: "model",
  },
  "identity/public.ts": {
    code: "export type { Person } from './person.js';",
    publicNames: ["Person"],
    role: "contract",
  },
} satisfies Readonly<Record<string, FixtureFile>>;

const analyze = (fixture: Readonly<Record<string, FixtureFile>>) => {
  const root = nodePath.resolve("apps/api/src/__architecture_fixture__");

  const sources = new Map(
    Object.entries(fixture).map(([file, entry]) => [
      nodePath.resolve(root, file),
      entry.code,
    ])
  );

  const options: ts.CompilerOptions = {
    experimentalDecorators: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    paths: { "@fixture/*": [nodePath.join(root, "*")] },
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  };

  const host = ts.createCompilerHost(options);
  const originalSource = host.getSourceFile.bind(host);
  const originalExists = host.fileExists.bind(host);
  const originalRead = host.readFile.bind(host);
  host.fileExists = (file) =>
    sources.has(nodePath.resolve(file)) || originalExists(file);
  host.readFile = (file) =>
    sources.get(nodePath.resolve(file)) ?? originalRead(file);
  host.directoryExists = (directory) =>
    [...sources.keys()].some((file) =>
      file.startsWith(`${nodePath.resolve(directory)}${nodePath.sep}`)
    ) || ts.sys.directoryExists(directory);
  host.getSourceFile = (
    file,
    languageVersion,
    onError,
    shouldCreateNewSourceFile
  ) => {
    const code = sources.get(nodePath.resolve(file));

    return code === undefined
      ? originalSource(
          file,
          languageVersion,
          onError,
          shouldCreateNewSourceFile
        )
      : ts.createSourceFile(
          file,
          code,
          options.target ?? ts.ScriptTarget.ES2022,
          true
        );
  };

  const names = new Set(
    Object.keys(fixture).map((file) => file.split("/")[0] ?? "")
  );

  const features: FeaturePolicy[] = [...names].map((name) => {
    const entries = Object.entries(fixture).filter(([file]) =>
      file.startsWith(`${name}/`)
    );

    return {
      files: Object.fromEntries(
        entries.flatMap(([file, entry]) =>
          entry.role ? [[file.slice(name.length + 1), entry.role]] : []
        )
      ),
      frameworkModules: Object.assign(
        {},
        ...entries.map(([, entry]) => entry.frameworkModules ?? {})
      ),
      name,
      providerExports: Object.assign(
        {},
        ...entries.map(([, entry]) => entry.providers ?? {})
      ),
      publicFiles: Object.fromEntries(
        entries.flatMap(([file, entry]) =>
          entry.publicNames
            ? [[file.slice(name.length + 1), entry.publicNames]]
            : []
        )
      ),
      root: name,
    };
  });

  const program = ts.createProgram([...sources.keys()], options, host);

  return checkArchitecture({ features, program, resolutionHost: host, root });
};

test("accepts flat feature services and named public business contracts", () => {
  assert.deepEqual(analyze(base), []);
});

test("feature aliases preserve public-contract access", () => {
  assert.deepEqual(
    analyze({
      ...base,
      "accounts/resolve-account.service.ts": {
        code: "import type { Person } from '@fixture/identity/public'; export const resolveAccount = (person: Person) => person.id;",
        role: "operation",
      },
    }),
    []
  );
});

test("feature aliases cannot bypass private feature boundaries", () => {
  const violations = analyze({
    ...base,
    "accounts/resolve-account.service.ts": {
      code: "import type { Person } from '@fixture/identity/person'; export const resolveAccount = (person: Person) => person.id;",
      role: "operation",
    },
  });

  assert.ok(
    violations.some((violation) => violation.rule === "private-import")
  );
});

test("Nest Drizzle injection stays out of controllers", () => {
  const violations = analyze({
    "accounts/controller.ts": {
      code: "import { InjectDrizzle } from '@nestjs/drizzle'; export const inject = InjectDrizzle;",
      role: "transport",
    },
  });

  assert.ok(
    violations.some((violation) => violation.rule === "adapter-access")
  );
});

test("accepts a plain query depending only on a read port", () => {
  assert.deepEqual(
    analyze({
      "accounts/read.ts": {
        code: "import type { Reader } from './reader.js'; export const read = (reader: Reader) => reader.find();",
        role: "query",
      },
      "accounts/reader.ts": {
        code: "export interface Reader { find(): string }",
        role: "read-port",
      },
    }),
    []
  );
});

test("accepts thin Nest CQRS handlers around plain operations", () => {
  assert.deepEqual(
    analyze({
      "accounts/handler.ts": {
        code: "import { CommandHandler } from '@nestjs/cqrs'; import { Message } from './message.js'; import { execute } from './operation.js'; @CommandHandler(Message) export class Handler { execute() { return execute(); } }",
        role: "handler",
      },
      "accounts/message.ts": {
        code: "export class Message {}",
        role: "message",
      },
      "accounts/operation.ts": {
        code: "export const execute = () => 'done';",
        role: "operation",
      },
    }),
    []
  );
});

test("accepts an explicitly approved CQRS framework module", () => {
  assert.deepEqual(
    analyze({
      "accounts/module.ts": {
        code: "import { Module } from '@nestjs/common'; import { CqrsModule } from '@nestjs/cqrs'; @Module({imports: [CqrsModule.forRoot()]}) export class AccountsModule {}",
        frameworkModules: { "@nestjs/cqrs": ["CqrsModule"] },
        providers: { AccountsModule: [] },
        role: "wiring",
      },
    }),
    []
  );
});

const forbidden: readonly {
  name: string;
  rule: string;
  files: Readonly<Record<string, FixtureFile>>;
}[] = [
  {
    files: {
      "accounts/read.service.ts": {
        code: "import type { Writer } from './writer.js'; export const read = (writer: Writer) => writer.save();",
        role: "query",
      },
      "accounts/writer.ts": {
        code: "export interface Writer { save(): void }",
        role: "port",
      },
    },
    name: "write ports in query operations",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/read.service.ts": {
        code: "import { write } from './write.js'; export const read = write;",
        role: "query",
      },
      "accounts/write.ts": {
        code: "export const write = () => {};",
        role: "operation",
      },
    },
    name: "write operations in query operations",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/message.ts": {
        code: "import { Command } from '@nestjs/cqrs'; export class Message extends Command<void> {}",
        role: "message",
      },
    },
    name: "Nest base classes in plain CQRS messages",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/query.ts": {
        code: "import { CommandBus } from '@nestjs/cqrs'; export const bus = CommandBus;",
        role: "query",
      },
    },
    name: "bus access in plain query services",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/handler.ts": {
        code: "import { eq } from 'drizzle-orm'; export const compare = eq;",
        role: "handler",
      },
    },
    name: "ORM access in CQRS handlers",
    rule: "adapter-access",
  },
  {
    files: {
      "accounts/handler.ts": {
        code: "import { repository } from './repository.js'; export const handle = repository;",
        role: "handler",
      },
      "accounts/repository.ts": {
        code: "export const repository = {};",
        role: "repository",
      },
    },
    name: "direct repository access in CQRS handlers",
    rule: "adapter-access",
  },
  {
    files: {
      "accounts/module.ts": {
        code: "import { Module } from '@nestjs/common'; import { CqrsModule } from '@nestjs/cqrs'; @Module({imports: [CqrsModule.forRoot()]}) export class AccountsModule {}",
        providers: { AccountsModule: [] },
        role: "wiring",
      },
    },
    name: "unapproved framework modules",
    rule: "module-import",
  },
  {
    files: {
      ...base,
      "accounts/resolve-account.service.ts": {
        code: "import type { Person } from '../identity/person.js'; export const id = (person: Person) => person.id;",
        role: "operation",
      },
    },
    name: "private cross-feature imports",
    rule: "private-import",
  },
  {
    files: {
      "accounts/integrations/some.service.ts": {
        code: "import { betterAuth } from 'better-auth'; export const auth = betterAuth({});",
        role: "operation",
      },
    },
    name: "SDK imports in a plain service despite an integrations folder",
    rule: "plain-dependency",
  },
  {
    files: {
      ...base,
      "identity/person.ts": {
        code: "export type { BetterAuthOptions as Person } from 'better-auth';",
        role: "integration",
      },
    },
    name: "SDK types laundered through a public barrel",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/accounts.controller.ts": {
        code: "import { eq } from 'drizzle-orm'; export const compare = eq;",
        role: "transport",
      },
    },
    name: "ORM access in controllers",
    rule: "adapter-access",
  },
  {
    files: {
      "accounts/accounts.controller.ts": {
        code: "import { Resend } from 'resend'; export const provider = Resend;",
        role: "transport",
      },
    },
    name: "unknown provider dependencies in controllers",
    rule: "adapter-access",
  },
  {
    files: {
      "accounts/accounts.controller.ts": {
        code: "import { query } from './repository.js'; export const read = query;",
        role: "transport",
      },
      "accounts/repository.ts": {
        code: "export const query = () => 1;",
        role: "repository",
      },
    },
    name: "direct repository access from a controller",
    rule: "adapter-access",
  },
  {
    files: {
      "accounts/resolve-account.service.ts": {
        code: "export const read = () => fetch('https://example.test');",
        role: "operation",
      },
    },
    name: "HTTP calls bypassing an owned business port",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/a.ts": {
        code: "import type { B } from './b.js'; export interface A { value: B }",
        role: "model",
      },
      "accounts/b.ts": {
        code: "import type { A } from './a.js'; export interface B { value: A }",
        role: "model",
      },
    },
    name: "type-only source cycles",
    rule: "source-cycle",
  },
  {
    files: {
      "accounts/accounts.module.ts": {
        code: "import { Module, forwardRef } from '@nestjs/common'; @Module({imports:[forwardRef(() => B)]}) class A {} @Module({imports:[forwardRef(() => A)]}) class B {}",
        providers: { A: [], B: [] },
        role: "wiring",
      },
    },
    name: "same-file Nest cycles hidden behind forwardRef",
    rule: "module-cycle",
  },
  {
    files: {
      "accounts/accounts.module.ts": {
        code: "import { Module, forwardRef } from '@nestjs/common'; import type { DynamicModule } from '@nestjs/common'; @Module({}) class A { static register(dependency: DynamicModule): DynamicModule { return { module: A, imports: [dependency] }; } } @Module({imports:[forwardRef(() => A)]}) class B {} export const runtime = A.register({ module: B });",
        providers: { A: [], B: [] },
        role: "wiring",
      },
    },
    name: "dynamic Nest cycles passed through factory parameters",
    rule: "module-cycle",
  },
  {
    files: {
      "accounts/accounts.module.ts": {
        code: "import { Module } from '@nestjs/common'; const SDK_ENGINE = Symbol('sdk'); @Module({providers:[{provide: SDK_ENGINE, useValue: {}}], exports:[SDK_ENGINE]}) class AccountsModule {}",
        providers: { AccountsModule: [] },
        role: "wiring",
      },
    },
    name: "unapproved SDK provider exports",
    rule: "provider-export",
  },
  {
    files: {
      "accounts/accounts.module.ts": {
        code: "import { Module } from '@nestjs/common'; @Module({}) class PrivateModule {} @Module({imports:[PrivateModule], exports:[PrivateModule]}) class AccountsModule {}",
        providers: { AccountsModule: ["PrivateModule"], PrivateModule: [] },
        role: "wiring",
      },
    },
    name: "whole-module re-exports",
    rule: "provider-export",
  },
  {
    files: {
      "accounts/accounts.module.ts": {
        code: "import { Module, Global } from '@nestjs/common'; @Global() @Module({}) class AccountsModule {}",
        providers: { AccountsModule: [] },
        role: "wiring",
      },
    },
    name: "globally injectable feature modules",
    rule: "global-module",
  },
  {
    files: {
      "accounts/provider.ts": {
        code: "const name = 'better-auth'; export const provider = import(name);",
        role: "integration",
      },
    },
    name: "computed dependency loading",
    rule: "dynamic-import",
  },
  {
    files: { "accounts/unknown.ts": { code: "export const unknown = 1;" } },
    name: "unclassified source files",
    rule: "unclassified-source",
  },
  {
    files: {
      ...base,
      "identity/public.ts": {
        code: "export * from './person.js';",
        publicNames: ["Person"],
        role: "contract",
      },
    },
    name: "wildcard public contracts",
    rule: "public-contract",
  },
  {
    files: {
      ...base,
      "accounts/resolve-account.service.ts": {
        code: "import type * as Identity from '../identity/public.js'; export type Owner = Identity.Person;",
        role: "operation",
      },
    },
    name: "namespace access to public contracts from business code",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/resolve-account.service.ts": {
        code: "export const request = new Request('https://example.test');",
        role: "operation",
      },
    },
    name: "transport objects inside plain operations",
    rule: "plain-dependency",
  },
  {
    files: {
      "accounts/accounts.module.ts": {
        code: "import { Module } from '@nestjs/common'; const hidden = { exports: [] }; @Module({...hidden}) class AccountsModule {}",
        providers: { AccountsModule: [] },
        role: "wiring",
      },
    },
    name: "opaque spreads in Nest metadata",
    rule: "module-import",
  },
  {
    files: {
      ...base,
      "accounts/accounts.controller.ts": {
        code: "import { Person } from '../identity/public.js'; export const read = Person;",
        role: "transport",
      },
      "identity/person.ts": {
        code: "export const Person = () => 1;",
        role: "integration",
      },
    },
    name: "adapter factories laundered through public contracts into controllers",
    rule: "adapter-access",
  },
  {
    files: {
      "accounts/resolve-account.service.ts": {
        code: "export const read = () => globalThis.fetch('https://example.test');",
        role: "operation",
      },
    },
    name: "HTTP access through globalThis in business operations",
    rule: "plain-dependency",
  },
];

for (const fixture of forbidden) {
  test(`rejects ${fixture.name}`, () => {
    const violations = analyze(fixture.files);
    assert.ok(
      violations.some((entry) => entry.rule === fixture.rule),
      JSON.stringify(violations)
    );
  });
}

test("permits a reviewed integration and a narrow provider export", () => {
  assert.deepEqual(
    analyze({
      "authentication/authentication.module.ts": {
        code: "import { Module } from '@nestjs/common'; const SESSIONS = Symbol('sessions'); @Module({providers:[{provide:SESSIONS,useValue:{}}],exports:[SESSIONS]}) export class AuthenticationModule {}",
        providers: { AuthenticationModule: ["SESSIONS"] },
        role: "wiring",
      },
      "authentication/integrations/auth.ts": {
        code: "import { betterAuth } from 'better-auth'; export const create = betterAuth;",
        role: "integration",
      },
    }),
    []
  );
});

test("business names can overlap transport names without creating a dependency", () => {
  assert.deepEqual(
    analyze({
      "accounts/request.ts": { code: "export class Request {}", role: "model" },
      "accounts/resolve-account.service.ts": {
        code: "import { Request } from './request.js'; export const request = new Request();",
        role: "operation",
      },
    }),
    []
  );
});
