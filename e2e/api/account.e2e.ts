import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { promisify } from "node:util";

import { startHarness } from "@e2e/api/harness";
import { apiErrorSchema, authErrorSchema } from "@gloups/contracts";
import { AccountApiError, createAccountClient } from "@gloups/contracts/client";
import { serverPort } from "@tools/mail-sink";
import { afterAll, beforeAll, describe, expect, test } from "e2e";

const cookieFrom = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

describe(
  "compiled Nest Node account flow with PostgreSQL",
  { serial: true },
  () => {
    type Harness = Awaited<ReturnType<typeof startHarness>>;

    let harness: Harness | undefined;
    let url: string;
    let sink: Harness["sink"];
    let sql: Harness["sql"];

    const getHarness = () => {
      assert.ok(harness, "The API fixture must be running");

      return harness;
    };

    beforeAll(async () => {
      harness = await startHarness();
      ({ url, sink, sql } = harness);
    });
    afterAll(async () => {
      await harness?.close();
    });
    const password = `Synthetic-${randomUUID()}`;

    const alice = {
      email: `${randomUUID()}@example.test`,
      name: "Zoë 合成",
      password,
    };

    const bob = { email: `${randomUUID()}@example.test`, name: "", password };

    const post = (
      path: string,
      body: Record<string, string | undefined>,
      cookie = "",
      headers: Record<string, string> = {}
    ) =>
      fetch(`${url}/api/auth/${path}`, {
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          cookie,
          origin: url,
          ...headers,
        },
        method: "POST",
        redirect: "manual",
      });

    let aliceCookie = "";
    let bobCookie = "";
    let accountId = "";
    test("upgrades existing rate-limit counters with backfilled audit timestamps", async () => {
      const database = "gloups_rate_limit_upgrade";
      await sql(`CREATE DATABASE ${database}`);

      try {
        await sql(
          await readFile(
            new URL(
              "../../apps/api/drizzle/0000_stiff_morbius.sql",
              import.meta.url
            ),
            "utf-8"
          ),
          database
        );
        await sql(
          "INSERT INTO auth_rate_limit (id, key, count, last_request) VALUES ('existing-counter', 'existing-key', 5, 1793311521743)",
          database
        );
        await sql(
          await readFile(
            new URL(
              "../../apps/api/drizzle/0001_rate_limit_audit_timestamps.sql",
              import.meta.url
            ),
            "utf-8"
          ),
          database
        );
        expect(
          await sql(
            "SELECT id || '|' || key || '|' || count || '|' || last_request FROM auth_rate_limit",
            database
          )
        ).toBe("existing-counter|existing-key|5|1793311521743");
        expect(
          await sql(
            "SELECT count(*) FROM auth_rate_limit WHERE created_at IS NOT NULL AND updated_at IS NOT NULL",
            database
          )
        ).toBe("1");
        await sql(
          "INSERT INTO auth_rate_limit (id, key, count, last_request) VALUES ('new-counter', 'new-key', 1, 1793311521744)",
          database
        );
        expect(
          await sql(
            "SELECT count(*) FROM auth_rate_limit WHERE created_at IS NOT NULL AND updated_at IS NOT NULL",
            database
          )
        ).toBe("2");
      } finally {
        await sql(`DROP DATABASE ${database}`);
      }
    });
    test("rejects anonymous and invalid requests with runtime-validated contracts", async () => {
      const readiness = await fetch(`${url}/healthz`);
      expect(readiness.status).toBe(200);
      expect(await readiness.json()).toEqual({ status: "ok" });
      expect((await fetch(`${url}/api/auth/ok`)).status).toBe(200);
      const anonymous = await fetch(`${url}/api/me`);
      expect(anonymous.status).toBe(401);
      expect(
        expect(await anonymous.json()).toMatchSchema(apiErrorSchema).error.code
      ).toBe("AUTH_REQUIRED");

      const invalid = await post("sign-up/email", {
        email: "invalid",
        name: "",
        password: "short",
      });

      expect(invalid.status).toBe(400);
      expect(await invalid.json()).toMatchSchema(authErrorSchema);

      const malformed = await fetch(`${url}/api/auth/sign-in/email`, {
        body: "{",
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      expect(malformed.status).toBe(400);

      const oversized = await post("sign-in/email", {
        value: "a".repeat(70_000),
      });

      expect(oversized.status).toBe(413);
    });
    test("persists two identities, requires verification and delivers synthetic mail", async () => {
      for (const input of [alice, bob]) {
        const response = await post("sign-up/email", {
          ...input,
          callbackURL: "gloups-health://verified",
        });

        expect(response.status).toBe(200);
        expect(cookieFrom(response)).toBe("");
      }

      expect(await sql("SELECT count(*) FROM auth_user")).toBe("2");
      expect(
        await sql(
          "SELECT count(*) FROM auth_account WHERE password IS NOT NULL AND length(password) > 64"
        )
      ).toBe("2");
      const unverified = await post("sign-in/email", alice);
      expect(unverified.status).toBe(403);
      expect(
        expect(await unverified.json()).toMatchSchema(authErrorSchema).code
      ).toBe("EMAIL_NOT_VERIFIED");
      expect(sink.messages.length).toBe(2);

      for (const message of sink.messages) {
        expect(message.kind).toBe("verification");
        const verified = await fetch(message.url, { redirect: "manual" });
        expect(verified.status).toBe(302);
        expect(verified.headers.get("location")).toBe(
          "gloups-health://verified"
        );
      }

      const badToken = await fetch(
        `${url}/api/auth/verify-email?token=invalid`
      );

      expect(badToken.status).toBe(401);
      const signInAlice = await post("sign-in/email", alice);
      expect(signInAlice.status).toBe(200);
      aliceCookie = cookieFrom(signInAlice);
      expect(signInAlice.headers.getSetCookie().join(";")).toMatch(
        /HttpOnly/iu
      );
      expect(signInAlice.headers.getSetCookie().join(";")).toMatch(
        /SameSite=Lax/iu
      );
      const signInBob = await post("sign-in/email", bob);
      expect(signInBob.status).toBe(200);
      bobCookie = cookieFrom(signInBob);
    });
    test("generated client returns only the authenticated account under concurrent access", async () => {
      const invalidSelection = await fetch(
        `${url}/api/me?accountId=untrusted`,
        {
          headers: { cookie: aliceCookie },
        }
      );

      expect(invalidSelection.status).toBe(400);
      expect(
        await sql("SELECT count(*) FROM gloups_account"),
        "Invalid transport input must be rejected before the provisioning command"
      ).toBe("0");

      const client = createAccountClient(url, () =>
        Promise.resolve(aliceCookie)
      );

      const responses = await Promise.all(
        Array.from({ length: 20 }, () => client.current())
      );

      expect(
        new Set(responses.map((response) => response.account.id)).size
      ).toBe(1);
      const [first] = responses;
      assert.ok(first);
      accountId = first.account.id;
      expect(first.user.email).toBe(alice.email);
      expect(first.user.name).toBe(alice.name);

      const other = await createAccountClient(url, () =>
        Promise.resolve(bobCookie)
      ).current();

      expect(other.account.id).not.toBe(accountId);
      expect(other.user.email).toBe(bob.email);

      const tampered = await fetch(`${url}/api/me?accountId=${accountId}`, {
        headers: { cookie: bobCookie },
      });

      expect(tampered.status).toBe(400);
      expect(
        expect(await tampered.json()).toMatchSchema(apiErrorSchema).error.code
      ).toBe("INVALID_REQUEST");

      const otherPath = await fetch(`${url}/api/accounts/${accountId}`, {
        headers: { cookie: bobCookie },
      });

      expect(otherPath.status).toBe(404);
      expect(await otherPath.json()).toMatchSchema(apiErrorSchema);
      await assert.rejects(
        createAccountClient(url, () =>
          Promise.resolve("gloups.session_token=forged")
        ).current(),
        { code: "AUTH_REQUIRED" }
      );
      expect(await sql("SELECT count(*) FROM gloups_account")).toBe("2");
    });
    test("preserves sessions and account mappings after clean API and database restarts", async () => {
      await getHarness().restartApi();
      await getHarness().restartDatabase();

      const current = await createAccountClient(url, () =>
        Promise.resolve(aliceCookie)
      ).current();

      expect(current.account.id).toBe(accountId);
      expect(current.user.email).toBe(alice.email);
    });
    test("recovers credentials with single-use links and revokes existing sessions", async () => {
      await sql("DELETE FROM auth_rate_limit");

      const missing = await post("request-password-reset", {
        email: `${randomUUID()}@example.test`,
        redirectTo: "gloups-health://reset-password",
      });

      expect(missing.status).toBe(200);

      const request = await post("request-password-reset", {
        email: alice.email,
        redirectTo: "gloups-health://reset-password",
      });

      expect(request.status).toBe(200);
      expect(await request.json()).toEqual(await missing.json());

      const message = sink.messages.find(
        (item) => item.kind === "password-reset"
      );

      assert.ok(message);
      const token = new URL(message.url).pathname.split("/").at(-1);
      const newPassword = `Recovered-${randomUUID()}`;
      expect(
        (await post("reset-password", { newPassword, token })).status
      ).toBe(200);
      expect(
        (await post("reset-password", { newPassword, token })).status
      ).toBe(400);
      await assert.rejects(
        createAccountClient(url, () => Promise.resolve(aliceCookie)).current(),
        AccountApiError
      );
      expect((await post("sign-in/email", alice)).status).toBe(401);

      const response = await post("sign-in/email", {
        email: alice.email,
        password: newPassword,
      });

      expect(response.status).toBe(200);
      aliceCookie = cookieFrom(response);
      expect(
        (
          await createAccountClient(url, () =>
            Promise.resolve(aliceCookie)
          ).current()
        ).account.id
      ).toBe(accountId);
    });
    test("sign-out and expiry immediately deny protected access", async () => {
      expect((await post("sign-out", {}, aliceCookie)).status).toBe(200);
      await assert.rejects(
        createAccountClient(url, () => Promise.resolve(aliceCookie)).current(),
        AccountApiError
      );
      await sql(
        "UPDATE auth_session SET expires_at = now() - interval '1 hour'"
      );
      await assert.rejects(
        createAccountClient(url, () => Promise.resolve(bobCookie)).current(),
        AccountApiError
      );
    });
    test("fails email delivery visibly and rate-limits spoofed IP headers", async () => {
      sink.setAccepting(false);

      const delivery = await post("request-password-reset", {
        email: bob.email,
      });

      expect(delivery.status).toBe(200);
      assert.ok(
        getHarness().diagnostics().includes("AUTH_EMAIL_DELIVERY_FAILED")
      );
      await sql("DELETE FROM auth_rate_limit");

      for (let index = 0; index < 5; index += 1) {
        const failed = await post("sign-in/email", alice);
        expect(failed.status).toBe(401);
      }

      const limited = await post("sign-in/email", alice, "", {
        "x-forwarded-for": "203.0.113.42",
        "x-gloups-client-ip": "203.0.113.42",
      });

      expect(limited.status).toBe(429);
      assert.ok(Number(limited.headers.get("retry-after")) > 0);
      expect(await limited.json()).toMatchSchema(authErrorSchema);
      expect(
        await sql(
          "SELECT count(*) FROM auth_rate_limit WHERE count = 5 AND updated_at > created_at"
        )
      ).toBe("1");
    });
  }
);

test("generated client validates success and error payloads at the network boundary", async () => {
  let status = 200;

  const server = createServer((_request, response) => {
    response
      .writeHead(status, { "content-type": "application/json" })
      .end(JSON.stringify({ unexpected: true }));
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const client = createAccountClient(
      `http://127.0.0.1:${serverPort(server)}`,
      () => Promise.resolve("")
    );

    await assert.rejects(client.current());
    status = 401;
    await assert.rejects(client.current());
  } finally {
    await promisify(server.close.bind(server))();
  }
});
