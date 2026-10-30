import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";

import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";

import type { AccountReader } from "../src/modules/identity-access/accounts/account-reader.port.js";
import type { AccountRepository } from "../src/modules/identity-access/accounts/account-repository.port.js";
import { ResolveAccountCommand } from "../src/modules/identity-access/accounts/commands/resolve-account.command.js";
import { ResolveAccountHandler } from "../src/modules/identity-access/accounts/commands/resolve-account.handler.js";
import { ResolveAccountService } from "../src/modules/identity-access/accounts/commands/resolve-account.service.js";
import type { CurrentAccount } from "../src/modules/identity-access/accounts/current-account.js";
import type { GloupsAccount } from "../src/modules/identity-access/accounts/gloups-account.js";
import { GetCurrentAccountHandler } from "../src/modules/identity-access/accounts/queries/get-current-account.handler.js";
import { GetCurrentAccountQuery } from "../src/modules/identity-access/accounts/queries/get-current-account.query.js";
import { GetCurrentAccountService } from "../src/modules/identity-access/accounts/queries/get-current-account.service.js";
import type { VerifiedIdentity } from "../src/modules/identity-access/authentication/public.js";

test("CQRS dispatch separates provisioning from read-only account queries", async () => {
  const identity: VerifiedIdentity = {
    email: "cqrs@example.test",
    emailVerified: true,
    id: "verified-identity",
    name: "Synthetic CQRS",
  };

  const bindings = new Map<string, GloupsAccount>();

  const identities = new Map<string, VerifiedIdentity>([
    ["valid", identity],
    ["unverified", { ...identity, emailVerified: false }],
  ]);

  let writes = 0;

  const reader: AccountReader = {
    findByIdentity: (identityId) =>
      Promise.resolve(bindings.get(identityId) ?? null),
  };

  const repository: AccountRepository = {
    resolve: (identityId, candidateId) => {
      writes += 1;

      const account = bindings.get(identityId) ?? {
        id: candidateId,
        identityId,
      };

      bindings.set(identityId, account);

      return Promise.resolve(account);
    },
  };

  @Module({
    imports: [CqrsModule.forRoot()],
    providers: [
      ResolveAccountHandler,
      GetCurrentAccountHandler,
      {
        provide: ResolveAccountService,
        useFactory: () =>
          new ResolveAccountService(
            {
              verify: (proof) => Promise.resolve(identities.get(proof) ?? null),
            },
            repository,
            () => "stable-account"
          ),
      },
      {
        provide: GetCurrentAccountService,
        useFactory: () => new GetCurrentAccountService(reader),
      },
    ],
  })
  // oxlint-disable-next-line typescript/no-extraneous-class -- Nest discovers the fixture through its module metadata.
  class FixtureModule {}

  const app = await NestFactory.createApplicationContext(FixtureModule, {
    logger: false,
  });

  const commands = app.get(CommandBus);
  const queries = app.get(QueryBus);

  try {
    await assert.rejects(
      queries.execute(new GetCurrentAccountQuery(identity)),
      /Account binding unavailable/u
    );
    assert.equal(writes, 0, "A query must never provision a missing account");
    await assert.rejects(
      commands.execute(new ResolveAccountCommand("invalid")),
      { code: "AUTH_REQUIRED" }
    );
    assert.equal(writes, 0, "Unauthenticated commands must not write");
    await assert.rejects(
      commands.execute(new ResolveAccountCommand("unverified")),
      { code: "EMAIL_UNVERIFIED" }
    );
    assert.equal(writes, 0, "Unverified commands must not write");

    const verified = await commands.execute<
      ResolveAccountCommand,
      VerifiedIdentity
    >(new ResolveAccountCommand("valid"));

    assert.equal(writes, 1);
    bindings.set("other-identity", {
      id: "other-account",
      identityId: "other-identity",
    });

    const current = await queries.execute<
      GetCurrentAccountQuery,
      CurrentAccount
    >(new GetCurrentAccountQuery(verified));

    assert.deepEqual(current, {
      account: { id: "stable-account" },
      user: { email: identity.email, emailVerified: true, name: identity.name },
    });
    await queries.execute(new GetCurrentAccountQuery(verified));
    assert.equal(writes, 1, "Repeated queries must remain read-only");
    await assert.rejects(
      queries.execute(
        new GetCurrentAccountQuery({ ...identity, emailVerified: false })
      ),
      { code: "EMAIL_UNVERIFIED" }
    );
    assert.equal(writes, 1);
  } finally {
    await app.close();
  }
});
