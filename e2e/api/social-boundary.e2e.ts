import { randomUUID } from "node:crypto";

import { expect, test } from "e2e";

import { installAuthHooks, post, responseStatus } from "./helpers/auth-api.js";

installAuthHooks();

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
