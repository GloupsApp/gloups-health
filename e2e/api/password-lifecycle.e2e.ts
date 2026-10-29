import { randomBytes, randomUUID } from "node:crypto";

import { expect, test } from "e2e";
import { z } from "zod";

import {
  installAuthHooks,
  cookies,
  deliveredLink,
  identity,
  origin,
  post,
  responseStatus,
  sink,
  sinkHeaders,
  sql,
  syntheticApple,
  verifiedIdentity,
} from "./helpers/auth-api.js";

installAuthHooks();

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
