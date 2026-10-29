import { spawn, execFileSync } from "node:child_process";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { loadEnvFile } from "node:process";

import { afterEach, beforeAll, beforeEach, expect, test } from "e2e";
import { z } from "zod";

loadEnvFile("apps/api/.env.local");

const origin = "http://127.0.0.1:4340";
const sink = "http://127.0.0.1:4341";
const database = new URL(process.env["DATABASE_URL"] ?? "");

if (
  process.env["APP_ENV"] !== "local" ||
  database.hostname !== "127.0.0.1" ||
  database.port !== "25440" ||
  database.pathname !== "/gloups_auth003"
) {
  throw new Error("E2E requires the isolated AUTH-003 synthetic database.");
}

const sinkHeaders = {
  authorization: `Bearer ${process.env["EMAIL_SINK_SECRET"] ?? ""}`,
  "content-type": "application/json",
};

beforeAll(async () => {
  await expect
    .poll(async () => {
      try {
        const response = await fetch(`${origin}/healthz`);

        return response.status;
      } catch {
        return 0;
      }
    })
    .toBe(200);
});

const sql = (statement: string): string =>
  execFileSync(
    "docker",
    [
      "compose",
      "-p",
      "gloups-auth-auth003",
      "--env-file",
      "apps/api/.env.local",
      "-f",
      "apps/api/compose.local.yaml",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "gloups_auth003",
      "-d",
      "gloups_auth003",
      "-qAt",
      "-c",
      statement,
    ],
    { encoding: "utf-8", timeout: 10_000 }
  ).trim();

const accountViewSchema = z
  .object({
    account: z.object({ id: z.uuid() }).strict(),
    user: z
      .object({
        email: z.email(),
        emailVerified: z.boolean(),
        name: z.string(),
      })
      .strict(),
  })
  .strict();

const inboxSchema = z.object({
  messages: z.array(
    z.object({
      message: z.object({
        kind: z.enum(["verify-email", "reset-password"]),
        language: z.enum(["en", "fr"]),
        recipient: z.email(),
        subject: z.string(),
        url: z.url(),
      }),
      receiptId: z.uuid(),
    })
  ),
});

const json = async (response: Response) =>
  accountViewSchema.parse(await response.json());

const responseStatus = async (pending: Promise<Response>): Promise<number> => {
  const response = await pending;

  return response.status;
};

const post = (
  routePath: string,
  body: string,
  cookie = ""
): Promise<Response> => {
  const headers = new Headers({ "content-type": "application/json", origin });

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return fetch(`${origin}${routePath}`, {
    body,
    headers,
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
};

const rejectedVerification = (response: Response): void => {
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(
    "gloups-health:///auth/callback?flow=verification&error=INVALID_TOKEN"
  );
  expect(response.headers.getSetCookie().length).toBe(0);
};

const identity = (language: "en" | "fr" = "en", name = "") => ({
  callbackURL: "gloups-health:///auth/callback?flow=verification",
  email: `auth003-${randomUUID()}@example.test`,
  name,
  password: randomBytes(24).toString("base64url"),
  preferredLanguage: language,
});

const deliveredLink = async (
  email: string,
  kind: "verify-email" | "reset-password"
) => {
  const response = await fetch(`${sink}/messages`, { headers: sinkHeaders });
  const inbox = inboxSchema.parse(await response.json());

  const found = inbox.messages.find(
    (entry) => entry.message.recipient === email && entry.message.kind === kind
  );

  if (!found) {
    throw new Error("No matching synthetic email receipt.");
  }

  return {
    language: found.message.language,
    subject: found.message.subject,
    url: found.message.url,
  };
};

const cookies = (response: Response): string =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

const verifiedIdentity = async (language: "en" | "fr" = "en", name = "") => {
  const user = identity(language, name);
  const signup = await post("/api/auth/sign-up/email", JSON.stringify(user));
  expect(signup.status).toBe(200);
  expect(signup.headers.getSetCookie().length).toBe(0);
  const link = await deliveredLink(user.email, "verify-email");
  const verification = await fetch(link.url, { redirect: "manual" });
  expect(verification.status).toBe(302);

  const signin = await post(
    "/api/auth/sign-in/email",
    JSON.stringify({
      email: user.email,
      password: user.password,
    })
  );

  expect(signin.status).toBe(200);
  const cookie = cookies(signin);
  expect(Boolean(cookie)).toBe(true);

  return { cookie, link, signin, user };
};

const deletionReceiptSchema = z
  .object({
    appleRevocation: z.enum([
      "pending",
      "complete",
      "manual_required",
      "not_applicable",
    ]),
    deletionId: z.uuid(),
    gloups: z.enum(["pending", "deleted"]),
  })
  .strict();

const ownedDeletions = new Set<string>();

const deleteAccount = (
  cookie: string,
  key: string,
  body?: { confirm: boolean }
) =>
  fetch(`${origin}/api/account`, {
    body: JSON.stringify(body ?? { confirm: true }),
    headers: {
      "content-type": "application/json",
      cookie,
      "idempotency-key": key,
      origin,
    },
    method: "DELETE",
  });

const runWorker = () =>
  execFileSync(
    "node",
    ["--env-file=.env.local", "dist/deletion-worker.js", "--once"],
    { cwd: "apps/api", encoding: "utf-8", timeout: 15_000 }
  );

const acceptedDeletion = async (cookie: string, key = randomUUID()) => {
  const response = await deleteAccount(cookie, key);
  expect(response.status).toBe(202);
  const receipt = deletionReceiptSchema.parse(await response.json());
  ownedDeletions.add(receipt.deletionId);
  expect(
    response.headers.getSetCookie().some((value) => /max-age=0/iu.test(value))
  ).toBe(true);

  return receipt;
};

beforeEach(async () => {
  sql("truncate table rate_limit, http_rate_limit");
  await fetch(`${sink}/control`, {
    body: JSON.stringify({ reject: false }),
    headers: sinkHeaders,
    method: "POST",
  });
  await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });
});

afterEach(async () => {
  await fetch(`${sink}/control`, {
    body: JSON.stringify({ reject: false }),
    headers: sinkHeaders,
    method: "POST",
  });
  await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });

  for (const id of ownedDeletions) {
    sql(
      `begin; delete from provider_credential where id in (select jsonb_array_elements_text(credential_refs) from deletion_job where id='${id}'); delete from identity_tombstone where deletion_id='${id}'; delete from deletion_job where id='${id}'; commit;`
    );
  }

  ownedDeletions.clear();
  sql(
    "begin; delete from verification where value in (select id from \"user\" where email like 'auth003-%@example.test'); delete from gloups_account where auth_user_id in (select id from \"user\" where email like 'auth003-%@example.test'); delete from \"user\" where email like 'auth003-%@example.test'; commit;"
  );
});

test(
  "API-01: Fastify mounting, CORS and body bounds",
  { platforms: ["api"] },
  async () => {
    expect(await responseStatus(fetch(`${origin}/healthz`))).toBe(200);
    expect(await responseStatus(fetch(`${origin}/api/auth/ok`))).toBe(200);
    expect(await responseStatus(fetch(`${origin}/api/me`))).toBe(401);

    const preflight = await fetch(`${origin}/api/auth/sign-in/email`, {
      headers: {
        "access-control-request-headers": "content-type",
        "access-control-request-method": "POST",
        origin,
      },
      method: "OPTIONS",
    });

    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe(origin);

    const malformed = await fetch(`${origin}/api/auth/sign-up/email`, {
      body: "{",
      headers: { "content-type": "application/json", origin },
      method: "POST",
    });

    expect(malformed.status).toBe(400);

    const oversized = await post(
      "/api/auth/sign-in/email",
      JSON.stringify({
        padding: "x".repeat(65_536),
      })
    );

    expect(oversized.status).toBe(413);
    expect(await responseStatus(fetch(`${origin}/api/unknown`))).toBe(404);
  }
);

test(
  "API-03/04: verified ownership stays unique across concurrent HTTP bootstrap",
  { platforms: ["api"] },
  async () => {
    const first = await verifiedIdentity("en", "Zoë 東京");

    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        fetch(`${origin}/api/me?owner=another-account`, {
          headers: { cookie: first.cookie },
        })
      )
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
    const accounts = await Promise.all(responses.map(json));
    const ids = accounts.map((body) => JSON.stringify(body["account"]));
    expect(new Set(ids).size).toBe(1);
    expect(Object.keys(accounts[0] ?? {}).toSorted()).toEqual([
      "account",
      "user",
    ]);
    const second = await verifiedIdentity();

    const secondAccount = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: second.cookie } })
    );

    expect(JSON.stringify(secondAccount["account"]) === ids[0]).toBe(false);
    expect(sql("select count(*) from gloups_account")).toBe("2");

    const invalid = await fetch(`${origin}/api/me`, {
      headers: { cookie: "gloups-health-local.session_token=forged" },
    });

    expect(invalid.status).toBe(401);
  }
);

test(
  "MAIL-01/03: French verification, unverified denial and single-use proof",
  { platforms: ["api"] },
  async () => {
    const user = identity("fr");
    expect(
      await responseStatus(
        post("/api/auth/sign-up/email", JSON.stringify(user))
      )
    ).toBe(200);

    const denied = await post(
      "/api/auth/sign-in/email",
      JSON.stringify({
        email: user.email,
        password: user.password,
      })
    );

    expect(denied.status).toBe(403);
    const link = await deliveredLink(user.email, "verify-email");
    expect(link.language).toBe("fr");
    expect(link.subject).toContain("Vérifiez");
    expect(new URL(link.url).origin).toBe(origin);
    expect(await responseStatus(fetch(link.url, { redirect: "manual" }))).toBe(
      302
    );
    rejectedVerification(await fetch(link.url, { redirect: "manual" }));
  }
);

for (const length of [14, 15, 128, 129]) {
  test(
    `MAIL-01: password length ${length} at the actual signup endpoint`,
    { platforms: ["api"] },
    async () => {
      const user = identity();

      const response = await post(
        "/api/auth/sign-up/email",
        JSON.stringify({
          ...user,
          password: randomBytes(128).toString("base64url").slice(0, length),
        })
      );

      expect(response.status).toBe(length < 15 || length > 128 ? 400 : 200);
    }
  );
}

test(
  "MAIL-02/04: generic recovery, reset consumption and immediate session revocation",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();

    const anotherSignin = await post(
      "/api/auth/sign-in/email",
      JSON.stringify({
        email: current.user.email,
        password: current.user.password,
      })
    );

    const anotherCookie = cookies(anotherSignin);

    const unknown = await post(
      "/api/auth/request-password-reset",
      JSON.stringify({
        email: `auth003-${randomUUID()}@example.test`,
        redirectTo: "gloups-health:///reset-password",
      })
    );

    const known = await post(
      "/api/auth/request-password-reset",
      JSON.stringify({
        email: current.user.email,
        redirectTo: "gloups-health:///reset-password",
      })
    );

    expect(unknown.status).toBe(200);
    expect(known.status).toBe(200);
    expect(await unknown.text()).toBe(await known.text());
    const reset = await deliveredLink(current.user.email, "reset-password");

    const token = z
      .string()
      .min(1)
      .parse(new URL(reset.url).pathname.split("/").at(-1));

    const newPassword = randomBytes(24).toString("base64url");
    expect(
      await responseStatus(
        post("/api/auth/reset-password", JSON.stringify({ newPassword, token }))
      )
    ).toBe(200);
    expect(
      await responseStatus(
        post("/api/auth/reset-password", JSON.stringify({ newPassword, token }))
      )
    ).toBe(400);

    const statuses = await Promise.all(
      [current.cookie, anotherCookie].map((cookie) =>
        responseStatus(fetch(`${origin}/api/me`, { headers: { cookie } }))
      )
    );

    expect(statuses).toEqual([401, 401]);
    expect(
      await responseStatus(
        post(
          "/api/auth/sign-in/email",
          JSON.stringify({
            email: current.user.email,
            password: current.user.password,
          })
        )
      )
    ).toBe(401);
    expect(
      await responseStatus(
        post(
          "/api/auth/sign-in/email",
          JSON.stringify({
            email: current.user.email,
            password: newPassword,
          })
        )
      )
    ).toBe(200);
  }
);

test(
  "MAIL-03: expired issuing-user ledger refuses a verification URL",
  { platforms: ["api"] },
  async () => {
    const user = identity();
    expect(
      await responseStatus(
        post("/api/auth/sign-up/email", JSON.stringify(user))
      )
    ).toBe(200);
    const link = await deliveredLink(user.email, "verify-email");
    sql(
      "update issued_verification set expires_at = now() - interval '1 second'"
    );
    rejectedVerification(await fetch(link.url, { redirect: "manual" }));
    expect(
      await responseStatus(
        post(
          "/api/auth/sign-in/email",
          JSON.stringify({
            email: user.email,
            password: user.password,
          })
        )
      )
    ).toBe(403);
  }
);

test(
  "MAIL-04: send failure is observable and retryable through the local sink",
  { platforms: ["api"] },
  async () => {
    const user = identity();
    expect(
      await responseStatus(
        post("/api/auth/sign-up/email", JSON.stringify(user))
      )
    ).toBe(200);
    await fetch(`${sink}/control`, {
      body: JSON.stringify({ reject: true }),
      headers: sinkHeaders,
      method: "POST",
    });

    const failed = await post(
      "/api/auth/send-verification-email",
      JSON.stringify({
        email: user.email,
      })
    );

    expect(failed.status).toBe(503);
    await fetch(`${sink}/control`, {
      body: JSON.stringify({ reject: false }),
      headers: sinkHeaders,
      method: "POST",
    });
    expect(
      await responseStatus(
        post(
          "/api/auth/send-verification-email",
          JSON.stringify({ email: user.email })
        )
      )
    ).toBe(200);
  }
);

test(
  "API-03: signin rate limits cannot be bypassed with a client IP header",
  { platforms: ["api"] },
  async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      // Requests are sequential so each observes the persisted rate counter.
      // oxlint-disable-next-line no-await-in-loop
      const response = await fetch(`${origin}/api/auth/sign-in/email`, {
        body: JSON.stringify({
          email: "auth003-missing@example.test",
          password: randomBytes(24).toString("base64url"),
        }),
        headers: {
          "content-type": "application/json",
          origin,
          "x-forwarded-for": `198.51.100.${attempt + 1}`,
          "x-gloups-client-ip": `198.51.100.${attempt + 1}`,
        },
        method: "POST",
      });

      expect(response.status).toBe(attempt < 5 ? 401 : 429);

      if (attempt === 5) {
        expect(Number(response.headers.get("retry-after")) > 0).toBe(true);
      }
    }
  }
);

test(
  "LIFE-01: sign-out clears server authority on the next protected request",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    expect(
      await responseStatus(
        post("/api/auth/sign-out", JSON.stringify({}), current.cookie)
      )
    ).toBe(200);
    expect(
      await responseStatus(
        fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
      )
    ).toBe(401);
  }
);

test(
  "API-02/SOCIAL-03: ordinary Nest JSON parsing validates Apple input before provider availability",
  { platforms: ["api"] },
  async () => {
    expect(
      await responseStatus(
        post(
          "/api/identity/apple/challenges",
          JSON.stringify({ nonceHash: "invalid", purpose: "sign-in" })
        )
      )
    ).toBe(400);
    expect(
      await responseStatus(
        post(
          "/api/identity/apple/challenges",
          JSON.stringify({
            nonceHash: "a".repeat(64),
            ownerId: randomUUID(),
            purpose: "sign-in",
          })
        )
      )
    ).toBe(400);

    const unavailable = await post(
      "/api/identity/apple/challenges",
      JSON.stringify({ nonceHash: "a".repeat(64), purpose: "sign-in" })
    );

    expect(unavailable.status).toBe(503);
    expect(unavailable.headers.getSetCookie().length).toBe(0);
    expect(
      await responseStatus(
        post(
          "/api/identity/apple/native",
          JSON.stringify({
            challengeId: randomUUID(),
            code: "invalid",
            nonce: "a".repeat(32),
          })
        )
      )
    ).toBe(503);
    expect(
      await responseStatus(
        post(
          "/api/identity/apple/notifications",
          JSON.stringify({ signedPayload: "invalid" })
        )
      )
    ).toBe(400);
  }
);

test(
  "SOCIAL-03: client-supplied proof headers never authorize direct provider ID tokens",
  { platforms: ["api"] },
  async () => {
    const response = await fetch(`${origin}/api/auth/sign-in/social`, {
      body: JSON.stringify({
        idToken: { nonce: "a".repeat(32), token: "invalid" },
        provider: "apple",
      }),
      headers: {
        "content-type": "application/json",
        origin,
        "x-gloups-native-proof": "true",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie().length).toBe(0);
    expect(
      await responseStatus(
        post(
          "/api/auth/sign-in/social",
          JSON.stringify({ idToken: { token: "invalid" }, provider: "google" })
        )
      )
    ).toBe(403);
  }
);

test(
  "DEL-01/03: deletion freezes two sessions, survives worker restart, and isolates re-registration proofs",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();

    const account = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
    );

    const second = await post(
      "/api/auth/sign-in/email",
      JSON.stringify(current.user)
    );

    expect(second.status).toBe(200);
    await post(
      "/api/auth/request-password-reset",
      JSON.stringify({
        email: current.user.email,
        redirectTo: "gloups-health:///reset-password",
      })
    );
    const reset = await deliveredLink(current.user.email, "reset-password");
    const oldResetToken = new URL(reset.url).pathname.split("/").at(-1);
    expect(
      await responseStatus(
        deleteAccount(current.cookie, randomUUID(), { confirm: false })
      )
    ).toBe(400);
    const receipt = await acceptedDeletion(current.cookie);
    expect(receipt.gloups).toBe("pending");
    expect(receipt.appleRevocation).toBe("not_applicable");

    const statuses = await Promise.all(
      [current.cookie, cookies(second)].map((cookie) =>
        responseStatus(fetch(`${origin}/api/me`, { headers: { cookie } }))
      )
    );

    expect(statuses).toEqual([401, 401]);
    expect(
      await responseStatus(deleteAccount(current.cookie, randomUUID()))
    ).toBe(401);
    expect(
      await responseStatus(fetch(`${origin}/api/account/${receipt.deletionId}`))
    ).toBe(404);
    expect(
      await responseStatus(
        post("/api/auth/sign-in/email", JSON.stringify(current.user))
      )
    ).toBe(403);
    // Simulate an interrupted worker lease in the real isolated database.
    sql(
      `update deletion_job set lease_id='${randomUUID()}',lease_until=now()+interval '1 minute' where id='${receipt.deletionId}'`
    );
    runWorker();
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("1");
    sql(
      `update deletion_job set lease_until=now()-interval '1 second' where id='${receipt.deletionId}'`
    );
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation || ':' || (auth_user_id is null)::text from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:not_applicable:true");
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("0");
    expect(
      sql(
        `select count(*) from gloups_account where id='${account.account.id}'`
      )
    ).toBe("0");
    expect(
      sql(
        'select count(*) from issued_verification where auth_user_id not in (select id from "user")'
      )
    ).toBe("0");

    const blocked = await post(
      "/api/auth/sign-up/email",
      JSON.stringify(current.user)
    );

    expect(blocked.status >= 400).toBe(true);
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("0");
    // Advance only this synthetic reservation beyond the explicit local security window.
    sql(
      `update identity_tombstone set expires_at=now()-interval '1 second' where deletion_id='${receipt.deletionId}'`
    );
    await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });

    const replacement = {
      ...current.user,
      password: randomBytes(24).toString("base64url"),
    };

    expect(
      await responseStatus(
        post("/api/auth/sign-up/email", JSON.stringify(replacement))
      )
    ).toBe(200);
    const link = await deliveredLink(replacement.email, "verify-email");
    expect(await responseStatus(fetch(link.url, { redirect: "manual" }))).toBe(
      302
    );

    const signin = await post(
      "/api/auth/sign-in/email",
      JSON.stringify(replacement)
    );

    expect(signin.status).toBe(200);

    const next = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: cookies(signin) } })
    );

    expect(next.account.id !== account.account.id).toBe(true);
    rejectedVerification(await fetch(current.link.url, { redirect: "manual" }));
    expect(
      await responseStatus(
        post(
          "/api/auth/reset-password",
          JSON.stringify({
            newPassword: randomBytes(24).toString("base64url"),
            token: oldResetToken,
          })
        )
      )
    ).toBe(400);
  }
);

test(
  "DEL-01: concurrent same-key commands create one durable receipt",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    const key = randomUUID();

    const responses = await Promise.all(
      Array.from({ length: 8 }, () => deleteAccount(current.cookie, key))
    );

    expect(
      responses.every((response) => [202, 401].includes(response.status))
    ).toBe(true);
    const accepted = responses.filter((response) => response.status === 202);
    expect(accepted.length > 0).toBe(true);

    const receipts = await Promise.all(
      accepted.map(async (response) =>
        deletionReceiptSchema.parse(await response.json())
      )
    );

    const ids = new Set(receipts.map((receipt) => receipt.deletionId));
    expect(ids.size).toBe(1);
    const id = z.uuid().parse(receipts[0]?.deletionId);
    ownedDeletions.add(id);
    expect(
      sql(`select count(*) from deletion_job where idempotency_key='${key}'`)
    ).toBe("1");
    runWorker();
  }
);

test(
  "DEL-02: failed durable handoff rolls back freeze and revocation",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();

    const before = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
    );

    sql(
      `create function auth003_fail_deletion() returns trigger language plpgsql as $$ begin if new.account_id='${before.account.id}' then raise exception 'Controlled synthetic handoff failure'; end if; return new; end $$; create trigger auth003_fail_deletion before insert on deletion_job for each row execute function auth003_fail_deletion();`
    );

    try {
      expect(
        await responseStatus(deleteAccount(current.cookie, randomUUID()))
      ).toBe(503);
      expect(
        await responseStatus(
          fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
        )
      ).toBe(200);
      expect(
        sql(
          `select deletion_id is null from gloups_account where id='${before.account.id}'`
        )
      ).toBe("t");
      expect(
        sql(
          `select count(*) from deletion_job where account_id='${before.account.id}'`
        )
      ).toBe("0");
    } finally {
      sql(
        "drop trigger auth003_fail_deletion on deletion_job; drop function auth003_fail_deletion();"
      );
    }
  }
);

const syntheticFingerprint = (kind: "identity" | "subject", value: string) =>
  createHmac("sha256", process.env["IDENTITY_FINGERPRINT_SECRET"] ?? "")
    .update(`${kind}:${value}`)
    .digest("hex");

const syntheticApple = (email: string, credential: boolean) => {
  const userId = sql(`select id from "user" where email='${email}'`);
  const subject = `auth003-sub-${randomUUID()}`;

  sql(
    `insert into account(id,account_id,provider_id,user_id,created_at,updated_at,identity_fingerprint,subject_fingerprint) values ('${randomUUID()}','${subject}','apple','${userId}',now(),now(),'${syntheticFingerprint("identity", userId)}','${syntheticFingerprint("subject", `apple:${subject}`)}')`
  );

  if (credential) {
    sql(
      `insert into provider_credential(id,apple_subject,auth_user_id,ciphertext,client_id,created_at,phase,retry_at) values('${randomUUID()}','${subject}','${userId}','synthetic-unreadable-credential','app.gloups.health',now(),'bound',now())`
    );
  }
};

test(
  "DEL-02: missing Apple material completes Gloups erasure with explicit manual guidance",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    syntheticApple(current.user.email, false);
    const receipt = await acceptedDeletion(current.cookie);
    expect(receipt.appleRevocation).toBe("manual_required");
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:manual_required");
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("0");
  }
);

test(
  "DEL-02: unavailable revocation retains only retry material, then applies the local fallback",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    // Deliberately unusable synthetic material exercises failure, never provider success.
    syntheticApple(current.user.email, true);
    const receipt = await acceptedDeletion(current.cookie);
    expect(receipt.appleRevocation).toBe("pending");
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation || ':' || (auth_user_id is null)::text || ':' || attempts::text from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:pending:true:1");
    expect(
      sql(
        `select count(*) from provider_credential where id in (select jsonb_array_elements_text(credential_refs) from deletion_job where id='${receipt.deletionId}') and auth_user_id is null and expected_actor_id is null and apple_subject='' and ciphertext is not null`
      )
    ).toBe("1");
    sql(
      `update deletion_job set created_at=now()-interval '2 days',retry_at=now()-interval '1 second' where id='${receipt.deletionId}'`
    );
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation || ':' || jsonb_array_length(credential_refs)::text from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:manual_required:0");
  }
);

test(
  "API-04: account binding and session persist across isolated database and API restarts",
  { platforms: ["api"], timeout: 60_000 },
  async () => {
    const current = await verifiedIdentity();

    const before = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
    );

    execFileSync(
      "docker",
      [
        "compose",
        "-p",
        "gloups-auth-auth003",
        "--env-file",
        "apps/api/.env.local",
        "-f",
        "apps/api/compose.local.yaml",
        "restart",
        "postgres",
      ],
      { encoding: "utf-8", stdio: "pipe", timeout: 30_000 }
    );

    const status = async () => {
      try {
        return await responseStatus(
          fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
        );
      } catch {
        return 0;
      }
    };

    await expect.poll(status, { timeout: 20_000 }).toBe(200);

    const listener = z.coerce
      .number()
      .int()
      .positive()
      .parse(
        execFileSync("lsof", ["-tiTCP:4340", "-sTCP:LISTEN"], {
          encoding: "utf-8",
        }).trim()
      );

    const workingDirectory = execFileSync(
      "lsof",
      ["-a", "-p", String(listener), "-d", "cwd", "-Fn"],
      { encoding: "utf-8" }
    );

    if (!workingDirectory.includes(`n${path.resolve("apps/api")}\n`)) {
      throw new Error("Different checkout listener preserved.");
    }

    process.kill(listener, "SIGTERM");
    await expect
      .poll(async () => {
        try {
          await fetch(`${origin}/healthz`);

          return false;
        } catch {
          return true;
        }
      })
      .toBe(true);

    const child = spawn("node", ["--env-file=.env.local", "dist/main.js"], {
      cwd: "apps/api",
      detached: true,
      stdio: "ignore",
    });

    child.unref();
    await expect.poll(status, { timeout: 20_000 }).toBe(200);

    const after = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
    );

    expect(after.account.id).toBe(before.account.id);
    expect(
      await responseStatus(
        post("/api/auth/sign-out", JSON.stringify({}), current.cookie)
      )
    ).toBe(200);
    expect(await status()).toBe(401);
  }
);

test(
  "LIFE-02/03: password setup is guarded, bounded, fresh and uses the official server API",
  { platforms: ["api"] },
  async () => {
    const password = randomBytes(24).toString("base64url");
    expect(
      await responseStatus(
        post(
          "/api/identity/password",
          JSON.stringify({ newPassword: password })
        )
      )
    ).toBe(401);
    const current = await verifiedIdentity();
    expect(
      await responseStatus(
        post(
          "/api/identity/password",
          JSON.stringify({ newPassword: password, ownerId: randomUUID() }),
          current.cookie
        )
      )
    ).toBe(400);
    expect(
      await responseStatus(
        post(
          "/api/identity/password",
          JSON.stringify({ newPassword: password }),
          current.cookie
        )
      )
    ).toBe(400);
    syntheticApple(current.user.email, false);
    sql(
      `delete from account where provider_id='credential' and user_id=(select id from "user" where email='${current.user.email}')`
    );
    expect(
      await responseStatus(
        post(
          "/api/identity/password",
          JSON.stringify({ newPassword: password }),
          current.cookie
        )
      )
    ).toBe(200);

    const signin = await post(
      "/api/auth/sign-in/email",
      JSON.stringify({ email: current.user.email, password })
    );

    expect(signin.status).toBe(200);
    sql(
      `update session set created_at=now()-interval '6 minutes' where user_id=(select id from "user" where email='${current.user.email}')`
    );
    expect(
      await responseStatus(
        post(
          "/api/identity/password",
          JSON.stringify({ newPassword: password }),
          current.cookie
        )
      )
    ).toBe(403);
  }
);

test(
  "LIFE-03: concurrent method unlinking preserves one usable method and rejects another owner's row",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    const other = await verifiedIdentity();
    syntheticApple(current.user.email, false);

    const foreignRow = sql(
      `select id from account where user_id=(select id from "user" where email='${other.user.email}') limit 1`
    );

    expect(
      await responseStatus(
        post(
          "/api/auth/unlink-account",
          JSON.stringify({ accountId: foreignRow }),
          current.cookie
        )
      )
    ).toBe(400);

    const ids = sql(
      `select id from account where user_id=(select id from "user" where email='${current.user.email}') order by id`
    ).split("\n");

    expect(ids.length).toBe(2);

    const statuses = await Promise.all(
      ids.map((accountId) =>
        responseStatus(
          post(
            "/api/auth/unlink-account",
            JSON.stringify({ accountId }),
            current.cookie
          )
        )
      )
    );

    expect(statuses.toSorted()).toEqual([200, 400]);
    expect(
      sql(
        `select count(*) from account where user_id=(select id from "user" where email='${current.user.email}')`
      )
    ).toBe("1");
  }
);

test(
  "MAIL-03: an expired signed verification proof fails before ledger consumption; concurrent valid consumption is single-use",
  { platforms: ["api"] },
  async () => {
    const user = identity();
    const signup = await post("/api/auth/sign-up/email", JSON.stringify(user));
    expect(signup.status).toBe(200);
    const authUserId = sql(`select id from "user" where email='${user.email}'`);

    const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString(
      "base64url"
    );

    const now = Math.floor(Date.now() / 1000);

    const payload = Buffer.from(
      JSON.stringify({
        email: user.email,
        exp: now - 3600,
        gloupsUserId: authUserId,
        iat: now - 7200,
        jti: randomUUID(),
      })
    ).toString("base64url");

    const signature = createHmac(
      "sha256",
      process.env["BETTER_AUTH_SECRET"] ?? ""
    )
      .update(`${header}.${payload}`)
      .digest("base64url");

    const expired = `${header}.${payload}.${signature}`;
    const hash = createHash("sha256").update(expired).digest("hex");
    sql(`insert into issued_verification (token_hash,auth_user_id,kind,expires_at)
      values ('${hash}','${authUserId}','verify-email',now()+interval '1 hour')`);

    const rejected = await fetch(
      `${origin}/api/auth/verify-email?token=${encodeURIComponent(expired)}`
    );

    expect(rejected.status).toBe(400);
    const emailedExpired = new URL(`${origin}/api/auth/verify-email`);
    emailedExpired.searchParams.set("token", expired);
    emailedExpired.searchParams.set("callbackURL", user.callbackURL);
    rejectedVerification(await fetch(emailedExpired, { redirect: "manual" }));
    expect(
      sql(`select count(*) from issued_verification where token_hash='${hash}'`)
    ).toBe("1");
    expect(
      sql(`select email_verified from "user" where id='${authUserId}'`)
    ).toBe("f");
    const link = await deliveredLink(user.email, "verify-email");

    const responses = await Promise.all([
      fetch(link.url, { redirect: "manual" }),
      fetch(link.url, { redirect: "manual" }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([302, 302]);

    const failedVerification = responses.filter((response) =>
      new URL(response.headers.get("location") ?? "").searchParams.has("error")
    );

    expect(failedVerification.length).toBe(1);
    const [failure] = failedVerification;

    if (!failure) {
      throw new Error("Expected one rejected verification response.");
    }

    rejectedVerification(failure);
    expect(
      sql(`select email_verified from "user" where id='${authUserId}'`)
    ).toBe("t");
  }
);

test(
  "MAIL-04: concurrent reset commands consume one proof and revoke every previous session",
  { platforms: ["api"] },
  async () => {
    const first = await verifiedIdentity();

    const extra = await post(
      "/api/auth/sign-in/email",
      JSON.stringify({
        email: first.user.email,
        password: first.user.password,
      })
    );

    const secondCookie = cookies(extra);

    const requested = await post(
      "/api/auth/request-password-reset",
      JSON.stringify({
        email: first.user.email,
        redirectTo: "gloups-health:///reset-password",
      })
    );

    expect(requested.status).toBe(200);
    const receipt = await deliveredLink(first.user.email, "reset-password");
    const redirect = await fetch(receipt.url, { redirect: "manual" });

    const token = new URL(
      redirect.headers.get("location") ?? ""
    ).searchParams.get("token");

    expect(Boolean(token)).toBe(true);

    const passwords = [
      randomBytes(24).toString("base64url"),
      randomBytes(24).toString("base64url"),
    ];

    const results = await Promise.all(
      passwords.map((newPassword) =>
        post("/api/auth/reset-password", JSON.stringify({ newPassword, token }))
      )
    );

    expect(results.map((response) => response.status).toSorted()).toEqual([
      200, 400,
    ]);
    expect(
      await responseStatus(
        fetch(`${origin}/api/me`, { headers: { cookie: first.cookie } })
      )
    ).toBe(401);
    expect(
      await responseStatus(
        fetch(`${origin}/api/me`, { headers: { cookie: secondCookie } })
      )
    ).toBe(401);
    const winner = results.findIndex((response) => response.status === 200);

    const success = await post(
      "/api/auth/sign-in/email",
      JSON.stringify({
        email: first.user.email,
        password: passwords[winner],
      })
    );

    expect(success.status).toBe(200);
  }
);

test(
  "API-04: account, denied and official auth responses prohibit HTTP storage",
  { platforms: ["api"] },
  async () => {
    const first = await verifiedIdentity();

    const me = await fetch(`${origin}/api/me`, {
      headers: { cookie: first.cookie },
    });

    expect(me.status).toBe(200);
    expect(me.headers.get("cache-control")).toBe("no-store");

    const session = await fetch(`${origin}/api/auth/get-session`, {
      headers: { cookie: first.cookie },
    });

    expect(session.status).toBe(200);
    expect(session.headers.get("cache-control")).toBe("no-store");
    await post("/api/auth/sign-out", "{}", first.cookie);

    const denied = await fetch(`${origin}/api/me`, {
      headers: { cookie: first.cookie },
    });

    expect(denied.status).toBe(401);
    expect(denied.headers.get("cache-control")).toBe("no-store");
  }
);

test(
  "MAIL-03: Expo native return URLs are accepted and invalid verification redirects remain trusted and proof-free",
  { platforms: ["api"] },
  async () => {
    const user = identity("fr");

    const badSignup = await post(
      "/api/auth/sign-up/email",
      JSON.stringify({
        ...user,
        callbackURL: "https://untrusted.test/auth/callback",
      })
    );

    expect(badSignup.status).toBe(403);
    expect(badSignup.headers.get("location")).toBe(null);
    expect(sql(`select count(*) from "user" where email='${user.email}'`)).toBe(
      "0"
    );
    expect(
      await responseStatus(
        post("/api/auth/sign-up/email", JSON.stringify(user))
      )
    ).toBe(200);
    const first = await deliveredLink(user.email, "verify-email");
    const untrusted = new URL(first.url);
    untrusted.searchParams.set(
      "callbackURL",
      "https://untrusted.test/auth/callback"
    );
    const rejected = await fetch(untrusted, { redirect: "manual" });
    expect(rejected.status).toBe(400);
    expect(rejected.headers.get("location")).toBe(null);
    expect(
      sql(`select email_verified from "user" where email='${user.email}'`)
    ).toBe("f");
    const success = await fetch(first.url, { redirect: "manual" });
    expect(success.status).toBe(302);
    expect(success.headers.get("location")).toBe(user.callbackURL);
    untrusted.searchParams.set(
      "callbackURL",
      "gloups-health:///auth/callback?cookie=untrusted&token=untrusted"
    );
    rejectedVerification(await fetch(untrusted, { redirect: "manual" }));

    await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });
    const pending = identity();
    expect(
      await responseStatus(
        post("/api/auth/sign-up/email", JSON.stringify(pending))
      )
    ).toBe(200);
    await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });
    expect(
      await responseStatus(
        post(
          "/api/auth/send-verification-email",
          JSON.stringify({
            callbackURL: pending.callbackURL,
            email: pending.email,
          })
        )
      )
    ).toBe(200);
    const resent = await deliveredLink(pending.email, "verify-email");
    expect(
      await responseStatus(fetch(resent.url, { redirect: "manual" }))
    ).toBe(302);

    for (const provider of ["google", "apple"]) {
      // These local providers are disabled. This proves URL validation, not OAuth success.
      // oxlint-disable-next-line no-await-in-loop
      const social = await post(
        "/api/auth/sign-in/social",
        JSON.stringify({ callbackURL: pending.callbackURL, provider })
      );

      expect(social.status >= 400).toBe(true);
      // oxlint-disable-next-line no-await-in-loop
      const body = z.object({ code: z.string() }).parse(await social.json());
      expect(body.code === "INVALID_CALLBACK_URL").toBe(false);
    }
  }
);

test(
  "DEL-01/MAIL-04: reset and sixteen deletion admissions preserve unrelated account progress beyond the main pool capacity",
  { platforms: ["api"], timeout: 30_000 },
  async () => {
    const current = await verifiedIdentity();
    const other = await verifiedIdentity();

    const userId = sql(
      `select id from "user" where email='${current.user.email}'`
    );

    expect(
      await responseStatus(
        post(
          "/api/auth/request-password-reset",
          JSON.stringify({
            email: current.user.email,
            redirectTo: "gloups-health:///reset-password",
          })
        )
      )
    ).toBe(200);
    const delivered = await deliveredLink(current.user.email, "reset-password");
    const redirected = await fetch(delivered.url, { redirect: "manual" });

    const token = new URL(
      redirected.headers.get("location") ?? ""
    ).searchParams.get("token");

    expect(Boolean(token)).toBe(true);
    sql(
      `create function auth003_pause_reset() returns trigger language plpgsql as $$ begin if new.user_id='${userId}' and new.provider_id='credential' and new.password is distinct from old.password then perform pg_sleep(3); end if; return new; end $$; create trigger auth003_pause_reset before update on account for each row execute function auth003_pause_reset();`
    );
    const commands: Promise<Response>[] = [];

    try {
      const resetting = post(
        "/api/auth/reset-password",
        JSON.stringify({
          newPassword: randomBytes(24).toString("base64url"),
          token,
        })
      );

      commands.push(resetting);
      await expect
        .poll(
          () =>
            sql(
              "select count(*) from pg_stat_activity where application_name='gloups-auth003-main' and wait_event='PgSleep'"
            ),
          { timeout: 5000 }
        )
        .toBe("1");
      const key = randomUUID();

      const deleting = Array.from({ length: 16 }, () =>
        fetch(`${origin}/api/account`, {
          body: JSON.stringify({ confirm: true }),
          headers: {
            "content-type": "application/json",
            cookie: current.cookie,
            "idempotency-key": key,
            origin,
          },
          method: "DELETE",
          signal: AbortSignal.timeout(15_000),
        })
      );

      commands.push(...deleting);
      await expect
        .poll(
          () =>
            sql(
              "select count(*) from pg_stat_activity where application_name='gloups-auth003-proof' and wait_event_type='Lock'"
            ),
          { timeout: 2000 }
        )
        .toBe("1");

      const progress = await fetch(`${origin}/api/me`, {
        headers: { cookie: other.cookie },
        signal: AbortSignal.timeout(1500),
      });

      expect(progress.status).toBe(200);
      expect(
        sql(
          "select count(*) from pg_stat_activity where application_name='gloups-auth003-main' and wait_event_type='Lock' and query like '%pg_advisory_xact_lock%'"
        )
      ).toBe("0");
      const resetResponse = await resetting;
      expect(resetResponse.status).toBe(200);
      const results = await Promise.all(deleting);
      expect(
        results.every((response) => [202, 401].includes(response.status))
      ).toBe(true);
      const accepted = results.filter((response) => response.status === 202);
      expect(accepted.length > 0).toBe(true);

      const receipts = await Promise.all(
        accepted.map(async (response) =>
          deletionReceiptSchema.parse(await response.json())
        )
      );

      expect(new Set(receipts.map((receipt) => receipt.deletionId)).size).toBe(
        1
      );
      const id = z.uuid().parse(receipts[0]?.deletionId);
      ownedDeletions.add(id);
      runWorker();
    } finally {
      await Promise.allSettled(commands);
      sql(
        "drop trigger auth003_pause_reset on account; drop function auth003_pause_reset();"
      );
    }
  }
);

test(
  "DEL-02: failed orphan revocation persists backoff, removes tagged sessions, runs expiry cleanup and expires at the local bound",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    const id = randomUUID();
    const challengeId = randomUUID();
    const marker = randomUUID();
    const expiredProof = randomUUID();
    sql(
      `insert into provider_credential(id,apple_subject,ciphertext,client_id,created_at,phase,retry_at) values('${id}','orphan-${id}','synthetic-unreadable-credential','app.gloups.health',now(),'prepared',now()-interval '1 second'); update session set native_setup_id='${id}' where user_id=(select id from "user" where email='${current.user.email}'); insert into apple_challenge(id,nonce_hash,purpose,expires_at) values('${challengeId}','synthetic','sign-in',now()-interval '1 second'); insert into apple_notification(id,processed_at) values('${marker}',now()-interval '3 days'); insert into verification(id,identifier,value,expires_at) values('${expiredProof}','auth003-expired','synthetic',now()-interval '1 second');`
    );

    try {
      runWorker();
      expect(
        sql(
          `select phase || ':' || attempts::text || ':' || (retry_at > now())::text from provider_credential where id='${id}'`
        )
      ).toBe("reconcile:1:true");
      expect(
        sql(`select count(*) from session where native_setup_id='${id}'`)
      ).toBe("0");
      expect(
        sql(
          `select (select count(*) from apple_challenge where id='${challengeId}') + (select count(*) from apple_notification where id='${marker}') + (select count(*) from verification where id='${expiredProof}')`
        )
      ).toBe("0");
      // A future schedule prevents an immediate retry even after a worker restart.
      sql(
        `update provider_credential set retry_at=now()+interval '1 hour' where id='${id}'`
      );
      runWorker();
      expect(
        sql(`select attempts from provider_credential where id='${id}'`)
      ).toBe("1");
      sql(
        `update provider_credential set created_at=now()-interval '2 days',retry_at=now()-interval '1 second' where id='${id}'`
      );
      runWorker();
      expect(
        sql(`select count(*) from provider_credential where id='${id}'`)
      ).toBe("0");
    } finally {
      sql(
        `delete from provider_credential where id='${id}'; delete from apple_challenge where id='${challengeId}'; delete from apple_notification where id='${marker}'; delete from verification where id='${expiredProof}';`
      );
    }
  }
);
