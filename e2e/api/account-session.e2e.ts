import { spawn, execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";

import { expect, test } from "e2e";
import { z } from "zod";

import {
  installAuthHooks,
  json,
  origin,
  post,
  responseStatus,
  sql,
  verifiedIdentity,
} from "./helpers/auth-api.js";

installAuthHooks();

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
