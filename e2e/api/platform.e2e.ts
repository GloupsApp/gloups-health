import { expect, test } from "e2e";
import { z } from "zod";

const origin = "http://127.0.0.1:4340";

test(
  "PLATFORM-01: Nest/Fastify serves health after database readiness",
  { platforms: ["api"] },
  async () => {
    const response = await fetch(`${origin}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });

    expect(response.status).toBe(200);
    expect(
      z
        .object({ status: z.literal("ok") })
        .strict()
        .parse(await response.json()).status
    ).toBe("ok");
  }
);

test(
  "PLATFORM-02: Nest registers credential-capable CORS for the configured local origin",
  { platforms: ["api"] },
  async () => {
    const response = await fetch(`${origin}/api/reserved`, {
      headers: {
        "access-control-request-headers": "content-type,idempotency-key",
        "access-control-request-method": "POST",
        origin,
      },
      method: "OPTIONS",
      signal: AbortSignal.timeout(5000),
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true"
    );
  }
);
