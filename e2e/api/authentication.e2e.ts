import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
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

const post = (path: string, body: string, cookie = ""): Promise<Response> => {
  const headers = new Headers({ "content-type": "application/json", origin });

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return fetch(`${origin}${path}`, {
    body,
    headers,
    method: "POST",
    redirect: "manual",
  });
};

const identity = (language: "en" | "fr" = "en", name = "") => ({
  callbackURL: "gloups-health://auth/callback",
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
    expect(await responseStatus(fetch(link.url, { redirect: "manual" }))).toBe(
      400
    );
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
        redirectTo: "gloups-health://auth/callback",
      })
    );

    const known = await post(
      "/api/auth/request-password-reset",
      JSON.stringify({
        email: current.user.email,
        redirectTo: "gloups-health://auth/callback",
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
    expect(await responseStatus(fetch(link.url, { redirect: "manual" }))).toBe(
      400
    );
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
