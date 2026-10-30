import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";

import type { AccountReader } from "@accounts/account-reader.port";
import type { AccountRepository } from "@accounts/account-repository.port";
import { ResolveAccountCommand } from "@accounts/commands/resolve-account.command";
import { ResolveAccountHandler } from "@accounts/commands/resolve-account.handler";
import { ResolveAccountService } from "@accounts/commands/resolve-account.service";
import type { CurrentAccount } from "@accounts/current-account";
import type { GloupsAccount } from "@accounts/gloups-account";
import { GetCurrentAccountHandler } from "@accounts/queries/get-current-account.handler";
import { GetCurrentAccountQuery } from "@accounts/queries/get-current-account.query";
import { GetCurrentAccountService } from "@accounts/queries/get-current-account.service";
import type { VerifiedIdentity } from "@authentication/public";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";

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
