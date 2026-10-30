import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import { promisify } from "node:util";

import {
  AccountApiError,
  createAccountClient,
} from "../../packages/contracts/dist/client.js";
import {
  apiErrorSchema,
  authErrorSchema,
} from "../../packages/contracts/dist/index.js";
import { serverPort } from "../../tools/mail-sink.ts";
import { startHarness } from "./harness.ts";

const cookieFrom = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

test(
  "compiled Nest Node account flow with PostgreSQL",
  { timeout: 120_000 },
  async (suite) => {
    const harness = await startHarness();
    const { url, sink, sql } = harness;
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

    try {
      await suite.test(
        "rejects anonymous and invalid requests with runtime-validated contracts",
        async () => {
          assert.equal((await fetch(`${url}/api/auth/ok`)).status, 200);
          const anonymous = await fetch(`${url}/api/me`);
          assert.equal(anonymous.status, 401);
          assert.equal(
            apiErrorSchema.parse(await anonymous.json()).error.code,
            "AUTH_REQUIRED"
          );

          const invalid = await post("sign-up/email", {
            email: "invalid",
            name: "",
            password: "short",
          });

          assert.equal(invalid.status, 400);
          authErrorSchema.parse(await invalid.json());

          const malformed = await fetch(`${url}/api/auth/sign-in/email`, {
            body: "{",
            headers: { "content-type": "application/json" },
            method: "POST",
          });

          assert.equal(malformed.status, 400);

          const oversized = await post("sign-in/email", {
            value: "a".repeat(70_000),
          });

          assert.equal(oversized.status, 413);
        }
      );
      await suite.test(
        "persists two identities, requires verification and delivers synthetic mail",
        async () => {
          for (const input of [alice, bob]) {
            const response = await post("sign-up/email", {
              ...input,
              callbackURL: "gloups-health://verified",
            });

            assert.equal(response.status, 200);
            assert.equal(cookieFrom(response), "");
          }

          assert.equal(await sql("SELECT count(*) FROM auth_user"), "2");
          assert.equal(
            await sql(
              "SELECT count(*) FROM auth_account WHERE password IS NOT NULL AND length(password) > 64"
            ),
            "2"
          );
          const unverified = await post("sign-in/email", alice);
          assert.equal(unverified.status, 403);
          assert.equal(
            authErrorSchema.parse(await unverified.json()).code,
            "EMAIL_NOT_VERIFIED"
          );
          assert.equal(sink.messages.length, 2);

          for (const message of sink.messages) {
            assert.equal(message.kind, "verification");
            const verified = await fetch(message.url, { redirect: "manual" });
            assert.equal(verified.status, 302);
            assert.equal(
              verified.headers.get("location"),
              "gloups-health://verified"
            );
          }

          const badToken = await fetch(
            `${url}/api/auth/verify-email?token=invalid`
          );

          assert.equal(badToken.status, 401);
          const signInAlice = await post("sign-in/email", alice);
          assert.equal(signInAlice.status, 200);
          aliceCookie = cookieFrom(signInAlice);
          assert.match(
            signInAlice.headers.getSetCookie().join(";"),
            /HttpOnly/iu
          );
          assert.match(
            signInAlice.headers.getSetCookie().join(";"),
            /SameSite=Lax/iu
          );
          const signInBob = await post("sign-in/email", bob);
          assert.equal(signInBob.status, 200);
          bobCookie = cookieFrom(signInBob);
        }
      );
      await suite.test(
        "generated client returns only the authenticated account under concurrent access",
        async () => {
          const invalidSelection = await fetch(
            `${url}/api/me?accountId=untrusted`,
            {
              headers: { cookie: aliceCookie },
            }
          );

          assert.equal(invalidSelection.status, 400);
          assert.equal(
            await sql("SELECT count(*) FROM gloups_account"),
            "0",
            "Invalid transport input must be rejected before the provisioning command"
          );

          const client = createAccountClient(url, () =>
            Promise.resolve(aliceCookie)
          );

          const responses = await Promise.all(
            Array.from({ length: 20 }, () => client.current())
          );

          assert.equal(
            new Set(responses.map((response) => response.account.id)).size,
            1
          );
          const [first] = responses;
          assert.ok(first);
          accountId = first.account.id;
          assert.equal(first.user.email, alice.email);
          assert.equal(first.user.name, alice.name);

          const other = await createAccountClient(url, () =>
            Promise.resolve(bobCookie)
          ).current();

          assert.notEqual(other.account.id, accountId);
          assert.equal(other.user.email, bob.email);

          const tampered = await fetch(`${url}/api/me?accountId=${accountId}`, {
            headers: { cookie: bobCookie },
          });

          assert.equal(tampered.status, 400);
          assert.equal(
            apiErrorSchema.parse(await tampered.json()).error.code,
            "INVALID_REQUEST"
          );

          const otherPath = await fetch(`${url}/api/accounts/${accountId}`, {
            headers: { cookie: bobCookie },
          });

          assert.equal(otherPath.status, 404);
          apiErrorSchema.parse(await otherPath.json());
          await assert.rejects(
            createAccountClient(url, () =>
              Promise.resolve("gloups.session_token=forged")
            ).current(),
            { code: "AUTH_REQUIRED" }
          );
          assert.equal(await sql("SELECT count(*) FROM gloups_account"), "2");
        }
      );
      await suite.test(
        "preserves sessions and account mappings after clean API and database restarts",
        async () => {
          await harness.restartApi();
          await harness.restartDatabase();

          const current = await createAccountClient(url, () =>
            Promise.resolve(aliceCookie)
          ).current();

          assert.equal(current.account.id, accountId);
          assert.equal(current.user.email, alice.email);
        }
      );
      await suite.test(
        "recovers credentials with single-use links and revokes existing sessions",
        async () => {
          await sql("DELETE FROM auth_rate_limit");

          const missing = await post("request-password-reset", {
            email: `${randomUUID()}@example.test`,
            redirectTo: "gloups-health://reset-password",
          });

          assert.equal(missing.status, 200);

          const request = await post("request-password-reset", {
            email: alice.email,
            redirectTo: "gloups-health://reset-password",
          });

          assert.equal(request.status, 200);
          assert.deepEqual(await request.json(), await missing.json());

          const message = sink.messages.find(
            (item) => item.kind === "password-reset"
          );

          assert.ok(message);
          const token = new URL(message.url).pathname.split("/").at(-1);
          const newPassword = `Recovered-${randomUUID()}`;
          assert.equal(
            (await post("reset-password", { newPassword, token })).status,
            200
          );
          assert.equal(
            (await post("reset-password", { newPassword, token })).status,
            400
          );
          await assert.rejects(
            createAccountClient(url, () =>
              Promise.resolve(aliceCookie)
            ).current(),
            AccountApiError
          );
          assert.equal((await post("sign-in/email", alice)).status, 401);

          const response = await post("sign-in/email", {
            email: alice.email,
            password: newPassword,
          });

          assert.equal(response.status, 200);
          aliceCookie = cookieFrom(response);
          assert.equal(
            (
              await createAccountClient(url, () =>
                Promise.resolve(aliceCookie)
              ).current()
            ).account.id,
            accountId
          );
        }
      );
      await suite.test(
        "sign-out and expiry immediately deny protected access",
        async () => {
          assert.equal((await post("sign-out", {}, aliceCookie)).status, 200);
          await assert.rejects(
            createAccountClient(url, () =>
              Promise.resolve(aliceCookie)
            ).current(),
            AccountApiError
          );
          await sql(
            "UPDATE auth_session SET expires_at = now() - interval '1 hour'"
          );
          await assert.rejects(
            createAccountClient(url, () =>
              Promise.resolve(bobCookie)
            ).current(),
            AccountApiError
          );
        }
      );
      await suite.test(
        "fails email delivery visibly and rate-limits spoofed IP headers",
        async () => {
          sink.setAccepting(false);

          const delivery = await post("request-password-reset", {
            email: bob.email,
          });

          assert.equal(delivery.status, 200);
          assert.ok(
            harness.diagnostics().includes("AUTH_EMAIL_DELIVERY_FAILED")
          );
          await sql("DELETE FROM auth_rate_limit");

          for (let index = 0; index < 5; index += 1) {
            const failed = await post("sign-in/email", alice);
            assert.equal(failed.status, 401);
          }

          const limited = await post("sign-in/email", alice, "", {
            "x-forwarded-for": "203.0.113.42",
            "x-gloups-client-ip": "203.0.113.42",
          });

          assert.equal(limited.status, 429);
          assert.ok(Number(limited.headers.get("retry-after")) > 0);
          authErrorSchema.parse(await limited.json());
        }
      );
    } finally {
      await harness.close();
    }
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
