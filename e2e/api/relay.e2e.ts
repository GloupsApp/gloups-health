import { afterEach, beforeEach, expect, test } from "e2e";
import { z } from "zod";

import {
  cleanupLocalIdentities,
  protectedStatus,
  resetLocalBudgets,
  verifiedFixture,
} from "../mobile/helpers/native-auth";
import { controlRelay, relayStatus } from "../mobile/helpers/relay-control";

beforeEach(async () => {
  await controlRelay({ mode: "forward" });
  await resetLocalBudgets();
});

afterEach(async () => {
  await controlRelay({ mode: "forward" });
  cleanupLocalIdentities();
});

test(
  "RELAY-01: the private fault relay forwards real SDK cookies and account data, holds a response and cuts transport",
  {
    platforms: ["api"],
    skip:
      process.env["GLOUPS_AUTH003_FAULTS"] === "1"
        ? false
        : "Requires the owned HTTP fault relay.",
    tags: ["relay"],
    timeout: 30_000,
  },
  async () => {
    const user = await verifiedFixture();

    const signin = await fetch("http://127.0.0.1:4342/api/auth/sign-in/email", {
      body: JSON.stringify({
        email: user.email,
        password: process.env["GLOUPS_AUTH003_E2E_PASSWORD"],
      }),
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:4340",
      },
      method: "POST",
    });

    expect(signin.status).toBe(200);
    expect(signin.headers.getSetCookie().length).toBeGreaterThan(0);
    expect(signin.headers.get("cache-control")).toBe("no-store");
    await controlRelay({ mode: "hold-next", path: "/api/me" });

    const pending = fetch("http://127.0.0.1:4342/api/me", {
      headers: { cookie: user.cookie },
    });

    await expect
      .poll(async () => {
        const status = await relayStatus();

        return status.heldCount;
      })
      .toBe(1);
    expect(await protectedStatus(user.cookie)).toBe(200);
    await controlRelay({ mode: "release" });

    const response = await pending;

    expect(response.status).toBe(200);

    const view = z
      .object({ account: z.object({ id: z.uuid() }) })
      .parse(await response.json());

    expect(view.account.id).toBe(user.accountId);
    await controlRelay({ mode: "cut" });
    let failed = false;

    try {
      await fetch("http://127.0.0.1:4342/healthz");
    } catch {
      failed = true;
    }

    expect(failed).toBe(true);
    expect(await protectedStatus(user.cookie)).toBe(200);
    await controlRelay({ mode: "forward" });

    const recovered = await fetch("http://127.0.0.1:4342/healthz");

    expect(recovered.status).toBe(200);
  }
);
