import { createHash, createHmac, randomUUID } from "node:crypto";

import { expect, test } from "e2e";
import { z } from "zod";

import {
  installAuthHooks,
  deliveredLink,
  identity,
  origin,
  post,
  rejectedVerification,
  responseStatus,
  sink,
  sinkHeaders,
  sql,
} from "./helpers/auth-api.js";

installAuthHooks();

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
