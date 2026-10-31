import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { startHarness } from "@e2e/api/harness";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "e2e";
import { z } from "zod";

const cookies = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .filter((cookie) => cookie && !cookie.endsWith("="))
    .join("; ");

const redirect = (response: Response) => {
  const location = response.headers.get("location");
  assert.ok(location, `Expected redirect, received ${response.status}`);

  return location;
};

const methodsSchema = z.array(
  z.object({ available: z.boolean(), id: z.string(), providerId: z.string() })
);

const synthetic = () => ({
  email: `${randomUUID()}@example.test`,
  subject: randomUUID(),
});

describe(
  "explicit linked methods with signed synthetic Apple and Google providers",
  { serial: true },
  () => {
    let harness: Awaited<ReturnType<typeof startHarness>>;
    const password = `Synthetic-${randomUUID()}`;
    beforeAll(async () => {
      harness = await startHarness({ providers: true });
    });
    afterAll(async () => {
      await harness?.close();
    });
    beforeEach(async () => {
      await harness.sql("DELETE FROM auth_rate_limit");
    });

    const post = (
      path: string,
      body: Record<string, string | boolean | { token: string } | undefined>,
      cookie = ""
    ) =>
      fetch(`${harness.url}/api/auth/${path}`, {
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          cookie,
          origin: harness.url,
        },
        method: "POST",
        redirect: "manual",
      });

    const me = (cookie: string) =>
      fetch(`${harness.url}/api/me`, { headers: { cookie } });

    const methods = async (cookie: string) =>
      methodsSchema.parse(
        await (
          await fetch(`${harness.url}/api/auth/methods`, {
            headers: { cookie },
          })
        ).json()
      );

    const startSocial = async (
      provider: "apple" | "google",
      cookie = "",
      linking = false
    ) => {
      const response = await post(
        linking ? "link-social" : "sign-in/social",
        {
          callbackURL: "gloups-health://auth-complete/army",
          disableRedirect: true,
          errorCallbackURL: "gloups-health://auth-complete/army",
          provider,
        },
        cookie
      );

      expect(response.status).toBe(200);
      const { url } = z.object({ url: z.url() }).parse(await response.json());

      return {
        cookie: [cookie, cookies(response)].filter(Boolean).join("; "),
        url: new URL(url),
      };
    };

    const finishSocial = async (
      started: Awaited<ReturnType<typeof startSocial>>,
      identity: Record<string, string>
    ) => {
      for (const [key, value] of Object.entries(identity)) {
        started.url.searchParams.set(key, value);
      }

      const authorization = await fetch(started.url, { redirect: "manual" });
      expect(authorization.status).toBe(302);

      return fetch(redirect(authorization), {
        headers: { cookie: started.cookie },
        redirect: "manual",
      });
    };

    const social = async (
      provider: "apple" | "google",
      identity = synthetic(),
      cookie = "",
      linking = false
    ) => {
      const response = await finishSocial(
        await startSocial(provider, cookie, linking),
        identity
      );

      expect(response.status).toBe(302);
      const error = new URL(redirect(response)).searchParams.get("error");
      expect(error).toBeNull();

      return { cookie: cookies(response), identity };
    };

    const event = async (
      provider: "apple" | "google",
      subject: string,
      type: string,
      options: { audience?: string; expired?: boolean } = {}
    ) => {
      const events =
        provider === "apple"
          ? JSON.stringify({ sub: subject, type })
          : {
              [`https://schemas.openid.net/secevent/${type}`]: {
                subject: {
                  iss: "https://accounts.google.com",
                  sub: subject,
                  subject_type: "iss-sub",
                },
              },
            };

      const url = new URL("/__fixture/sign-event", harness.url);
      const payload = { events, exp: options.expired ? 1 : undefined };

      const parameters = new URLSearchParams({
        payload: JSON.stringify(payload),
        provider,
      });

      if (options.audience) {
        parameters.set("audience", options.audience);
      }

      url.search = parameters.toString();

      const { token } = z
        .object({ token: z.string() })
        .parse(await (await fetch(url)).json());

      const response = await fetch(
        `${harness.url}/api/auth/provider-notifications/${provider}`,
        {
          body:
            provider === "apple" ? JSON.stringify({ payload: token }) : token,
          headers: {
            "content-type":
              provider === "apple"
                ? "application/json"
                : "application/secevent+jwt",
          },
          method: "POST",
        }
      );

      return { response, token };
    };

    test("Apple and Google establish separate API sessions and explicit linking preserves the Gloups account", async () => {
      const apple = await social("apple");
      const google = await social("google");
      const original = await (await me(apple.cookie)).json();

      const noEmail = await finishSocial(await startSocial("apple"), {
        ...apple.identity,
        omit_email: "true",
      });

      expect(new URL(redirect(noEmail)).searchParams.has("error")).toBe(false);
      expect(await (await me(cookies(noEmail))).json()).toEqual(original);
      expect(await (await me(google.cookie)).json()).not.toEqual(original);
      expect(
        (await methods(apple.cookie)).map((method) => method.providerId)
      ).toEqual(["apple"]);
      const additional = synthetic();
      await social("google", additional, apple.cookie, true);
      const returning = await social("google", additional);
      expect(await (await me(returning.cookie)).json()).toEqual(original);
      expect((await methods(apple.cookie)).length).toBe(2);
    });

    test("email collisions do not merge accounts and a provider cannot be linked to a second person", async () => {
      const owner = await social("apple");
      const attacker = await social("google");

      const collision = await finishSocial(await startSocial("google"), {
        email: owner.identity.email,
        subject: randomUUID(),
      });

      expect(new URL(redirect(collision)).searchParams.get("error")).toBe(
        "account_not_linked"
      );
      expect(cookies(collision)).not.toContain("session_token");

      const transfer = await finishSocial(
        await startSocial("apple", attacker.cookie, true),
        owner.identity
      );

      expect(new URL(redirect(transfer)).searchParams.get("error")).toBe(
        "account_already_linked_to_different_user"
      );
      expect((await methods(owner.cookie)).length).toBe(1);
      expect((await methods(attacker.cookie)).length).toBe(1);

      const signedInCollision = await finishSocial(
        await startSocial("apple", attacker.cookie),
        { email: attacker.identity.email, subject: randomUUID() }
      );

      expect(
        new URL(redirect(signedInCollision)).searchParams.get("error")
      ).toBe("account_not_linked");
    });

    test("linking requires a recent authenticated session and fails if that session is revoked during the provider flow", async () => {
      expect((await post("link-social", { provider: "google" })).status).toBe(
        401
      );
      const owner = await social("apple");
      const started = await startSocial("google", owner.cookie, true);
      expect((await post("sign-out", {}, owner.cookie)).status).toBe(200);
      const response = await finishSocial(started, synthetic());
      expect(new URL(redirect(response)).searchParams.get("error")).toBe(
        "link_session_expired"
      );
      const signedIn = await social("apple", owner.identity);
      await harness.sql(
        "UPDATE auth_session SET created_at = now() - interval '10 minutes'"
      );

      const stale = await post(
        "link-social",
        { provider: "google" },
        signedIn.cookie
      );

      expect(stale.status).toBe(401);
      expect((await stale.json())["code"]).toBe("FRESH_SESSION_REQUIRED");
    });

    test("provider cancellation, token expiry, state tampering and callback replay fail without creating a session", async () => {
      const cancelled = await finishSocial(await startSocial("apple"), {
        error: "access_denied",
      });

      expect(new URL(redirect(cancelled)).searchParams.get("error")).toBe(
        "access_denied"
      );

      const expired = await finishSocial(await startSocial("google"), {
        ...synthetic(),
        expired: "true",
      });

      expect(cookies(expired)).not.toContain("session_token");
      const started = await startSocial("apple");
      started.url.searchParams.set("state", randomUUID());
      const tampered = await finishSocial(started, synthetic());
      expect(cookies(tampered)).not.toContain("session_token");
      const valid = await startSocial("google");
      const first = await finishSocial(valid, synthetic());
      expect(cookies(first)).toContain("session_token");
      const replay = await finishSocial(valid, synthetic());
      expect(cookies(replay)).not.toContain("session_token");

      const directToken = await post("sign-in/social", {
        idToken: { token: "untrusted" },
        provider: "google",
      });

      expect(directToken.status).toBe(400);
    });

    test("password recovery never adds a first password to a social-only account, including a pre-existing reset token", async () => {
      const owner = await social("google");
      const before = harness.sink.messages.length;

      const unknown = await post("request-password-reset", {
        email: `${randomUUID()}@example.test`,
      });

      const reset = await post("request-password-reset", {
        email: owner.identity.email,
      });

      expect(reset.status).toBe(200);
      expect(await reset.json()).toEqual(await unknown.json());
      expect(harness.sink.messages.length).toBe(before);

      const userId = await harness.sql(
        `SELECT id FROM auth_user WHERE email = '${owner.identity.email}'`
      );

      const token = randomUUID();
      await harness.sql(
        `INSERT INTO auth_verification (id, identifier, value, expires_at) VALUES ('${randomUUID()}', 'reset-password:${token}', '${userId}', now() + interval '1 hour')`
      );
      expect(
        (await post("reset-password", { newPassword: password, token })).status
      ).toBe(400);
      expect(
        (await post("methods/password", { newPassword: password })).status
      ).toBe(401);
      expect((await methods(owner.cookie)).length).toBe(1);
      expect(
        (
          await post(
            "methods/password",
            { newPassword: password },
            owner.cookie
          )
        ).status
      ).toBe(200);
      expect(
        (
          await post(
            "methods/password",
            { newPassword: password },
            owner.cookie
          )
        ).status
      ).toBe(400);

      expect(
        (await post("reset-password", { newPassword: password, token })).status
      ).toBe(400);

      const credential = await post("sign-in/email", {
        email: owner.identity.email,
        password,
      });

      expect(credential.status).toBe(200);
      expect(await (await me(cookies(credential))).json()).toEqual(
        await (await me(owner.cookie)).json()
      );
    });

    test("unlinking enforces ownership and the last available method, revokes sessions and resists concurrent removals", async () => {
      const owner = await social("apple");
      const other = await social("google");
      const [only] = await methods(owner.cookie);
      assert.ok(only);
      expect(
        (await post("methods/unlink", { accountId: only.id }, other.cookie))
          .status
      ).toBe(400);
      expect(
        (await post("methods/unlink", { accountId: only.id }, owner.cookie))
          .status
      ).toBe(400);
      await social("google", synthetic(), owner.cookie, true);
      const linked = await methods(owner.cookie);

      const removed = await Promise.all(
        linked.map((method) =>
          post("methods/unlink", { accountId: method.id }, owner.cookie)
        )
      );

      expect(removed.filter((response) => response.status === 200).length).toBe(
        1
      );

      const userId = await harness.sql(
        `SELECT id FROM auth_user WHERE email = '${owner.identity.email}'`
      );

      expect(
        await harness.sql(
          `SELECT count(*) FROM auth_account WHERE user_id = '${userId}'`
        )
      ).toBe("1");
      expect((await me(owner.cookie)).status).toBe(401);
      expect((await me(other.cookie)).status).toBe(200);
    });

    test("signed provider revocation invalidates every affected session; forged or misaddressed events cannot revoke another account", async () => {
      const owner = await social("google");
      const other = await social("apple");
      expect(
        (
          await post(
            "methods/password",
            { newPassword: password },
            owner.cookie
          )
        ).status
      ).toBe(200);

      const credential = await post("sign-in/email", {
        email: owner.identity.email,
        password,
      });

      const invalid = await event(
        "google",
        owner.identity.subject,
        "oauth/event-type/tokens-revoked",
        { audience: "someone-else" }
      );

      expect(invalid.response.status).toBe(400);

      const expired = await event(
        "google",
        owner.identity.subject,
        "oauth/event-type/tokens-revoked",
        { expired: true }
      );

      expect(expired.response.status).toBe(400);
      expect((await me(owner.cookie)).status).toBe(200);

      const revoked = await event(
        "google",
        owner.identity.subject,
        "oauth/event-type/tokens-revoked"
      );

      expect(revoked.response.status).toBe(202);
      expect((await me(owner.cookie)).status).toBe(401);
      expect((await me(cookies(credential))).status).toBe(401);
      expect((await me(other.cookie)).status).toBe(200);

      const forged = await post("provider-notifications/apple", {
        payload: `${revoked.token.slice(0, -10)}xxxxxxxxxx`,
      });

      expect(forged.status).toBe(400);

      const old = await finishSocial(await startSocial("google"), {
        ...owner.identity,
        iat: String(Math.floor(Date.now() / 1000) - 10),
      });

      expect(new URL(redirect(old)).searchParams.get("error")).toBe(
        "provider_access_revoked"
      );

      const recovered = await post("sign-in/email", {
        email: owner.identity.email,
        password,
      });

      expect(recovered.status).toBe(200);
      const revokedMethods = await methods(cookies(recovered));

      const credentialMethod = revokedMethods.find(
        (method) => method.providerId === "credential"
      );

      assert.ok(credentialMethod);
      expect(
        (
          await post(
            "methods/unlink",
            { accountId: credentialMethod.id },
            cookies(recovered)
          )
        ).status
      ).toBe(400);
    });

    test("losing a sole Apple method cannot be bypassed with email recovery; renewed provider authentication retains the account", async () => {
      const owner = await social("apple");
      const original = await (await me(owner.cookie)).json();
      expect(
        (await event("apple", owner.identity.subject, "consent-revoked"))
          .response.status
      ).toBe(200);
      expect((await me(owner.cookie)).status).toBe(401);
      const before = harness.sink.messages.length;
      expect(
        (await post("request-password-reset", { email: owner.identity.email }))
          .status
      ).toBe(200);
      expect(harness.sink.messages.length).toBe(before);

      const restored = await finishSocial(await startSocial("apple"), {
        ...owner.identity,
        iat: String(Math.floor(Date.now() / 1000) + 2),
      });

      expect(new URL(redirect(restored)).searchParams.get("error")).toBeNull();
      expect(await (await me(cookies(restored))).json()).toEqual(original);
      expect(
        (await post("revoke-sessions", {}, cookies(restored))).status
      ).toBe(200);
      expect((await me(cookies(restored))).status).toBe(401);
    });

    test("verification and recovery links expire, have one winner on reuse, and throttle sending and failed redemption", async () => {
      const identity = synthetic();
      expect(
        (
          await post("sign-up/email", {
            callbackURL: "gloups-health://verified",
            email: identity.email,
            name: "",
            password,
          })
        ).status
      ).toBe(200);

      const email = harness.sink.messages.find(
        (message) =>
          message.recipient === identity.email &&
          message.kind === "verification"
      );

      assert.ok(email);
      const first = await fetch(email.url, { redirect: "manual" });
      expect(first.status).toBe(302);
      expect(
        new URL(redirect(first), harness.url).searchParams.has("error")
      ).toBe(false);

      const replayedVerification = await fetch(email.url, {
        redirect: "manual",
      });

      expect(
        new URL(redirect(replayedVerification)).searchParams.get("error")
      ).toBe("INVALID_TOKEN");
      const unverified = synthetic();
      expect(
        (
          await post("sign-up/email", {
            callbackURL: "gloups-health://verified",
            email: unverified.email,
            name: "",
            password,
          })
        ).status
      ).toBe(200);

      const expiring = harness.sink.messages.find(
        (message) => message.recipient === unverified.email
      );

      assert.ok(expiring);
      await harness.sql(
        "UPDATE auth_verification SET expires_at = now() - interval '1 minute'"
      );

      const expiredVerification = await fetch(expiring.url, {
        redirect: "manual",
      });

      expect(
        new URL(redirect(expiredVerification)).searchParams.get("error")
      ).toBe("INVALID_TOKEN");
      expect(
        (await post("request-password-reset", { email: identity.email })).status
      ).toBe(200);

      const resetEmail = harness.sink.messages.find(
        (message) =>
          message.recipient === identity.email &&
          message.kind === "password-reset"
      );

      assert.ok(resetEmail);
      const token = new URL(resetEmail.url).pathname.split("/").at(-1);
      await harness.sql(
        "UPDATE auth_verification SET expires_at = now() - interval '1 minute'"
      );
      expect(
        (await post("reset-password", { newPassword: password, token })).status
      ).toBe(400);
      await post("request-password-reset", { email: identity.email });

      const fresh = harness.sink.messages.findLast(
        (message) =>
          message.recipient === identity.email &&
          message.kind === "password-reset"
      );

      assert.ok(fresh);
      const freshToken = new URL(fresh.url).pathname.split("/").at(-1);

      const redeemed = await Promise.all(
        [1, 2].map(() =>
          post("reset-password", { newPassword: password, token: freshToken })
        )
      );

      expect(redeemed.map((response) => response.status).toSorted()).toEqual([
        200, 400,
      ]);

      for (const path of [
        "send-verification-email",
        "request-password-reset",
      ]) {
        await harness.sql("DELETE FROM auth_rate_limit");

        for (let count = 0; count < 3; count += 1) {
          expect((await post(path, { email: unverified.email })).status).toBe(
            200
          );
        }

        const limited = await post(path, { email: unverified.email });
        expect(limited.status).toBe(429);
        assert.ok(Number(limited.headers.get("retry-after")) > 0);
      }

      await harness.sql("DELETE FROM auth_rate_limit");

      for (let count = 0; count < 5; count += 1) {
        expect(
          (
            await post("reset-password", {
              newPassword: password,
              token: "invalid",
            })
          ).status
        ).toBe(400);
      }

      expect(
        (
          await post("reset-password", {
            newPassword: password,
            token: "invalid",
          })
        ).status
      ).toBe(429);
      await harness.sql("DELETE FROM auth_rate_limit");

      for (let count = 0; count < 10; count += 1) {
        expect(
          (await fetch(`${harness.url}/api/auth/verify-email?token=invalid`))
            .status
        ).toBe(401);
      }

      expect(
        (await fetch(`${harness.url}/api/auth/verify-email?token=invalid`))
          .status
      ).toBe(429);
    });
  }
);
