import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnvFile } from "node:process";

import { z } from "zod";

loadEnvFile("apps/api/.env.local");

loadEnvFile(
  ".superpowers/sdd/2026-10-28-authentication-implementation/relay.env.local"
);

const database = new URL(process.env["DATABASE_URL"] ?? "");

if (
  process.env["APP_ENV"] !== "local" ||
  database.hostname !== "127.0.0.1" ||
  database.port !== "25440" ||
  database.pathname !== "/gloups_auth003"
) {
  throw new Error(
    "The fault relay is restricted to local AUTH-003 acceptance."
  );
}

const secret = z
  .string()
  .min(32)
  .parse(process.env["GLOUPS_AUTH003_RELAY_SECRET"]);

const origin = "http://127.0.0.1:4340";

const controlSchema = z
  .object({
    mode: z.enum(["forward", "hold-next", "release", "cut"]),
    path: z.enum(["/api/me", "/api/auth/sign-in/email"]).optional(),
  })
  .strict();

let cut = false;
let nextPath: string | null = null;
let heldCount = 0;
let waiting: (() => void) | null = null;

const readBody = async (request: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  let length = 0;

  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += bytes.length;

    if (length > 65_536) {
      throw new Error("Relay input exceeds the auth body boundary.");
    }

    chunks.push(bytes);
  }

  return Buffer.concat(chunks);
};

const control = async (
  request: IncomingMessage,
  reply: ServerResponse
): Promise<void> => {
  if (request.headers.authorization !== `Bearer ${secret}`) {
    reply.writeHead(401).end();

    return;
  }

  if (request.method === "POST") {
    const bytes = await readBody(request);
    const input = controlSchema.parse(JSON.parse(bytes.toString("utf-8")));
    cut = input.mode === "cut";

    if (input.mode === "hold-next") {
      if (!input.path || waiting) {
        reply.writeHead(409).end();

        return;
      }

      nextPath = input.path;
      heldCount = 0;
    } else {
      nextPath = null;
      waiting?.();
      waiting = null;
    }
  }

  reply.writeHead(200, { "content-type": "application/json" });
  reply.end(JSON.stringify({ heldCount, waiting: Boolean(waiting) }));
};

const forward = async (
  request: IncomingMessage,
  reply: ServerResponse
): Promise<void> => {
  const url = new URL(request.url ?? "/", origin);

  if (url.origin !== origin || !/^\/(?:api\/|healthz$)/u.test(url.pathname)) {
    reply.writeHead(404).end();

    return;
  }

  const body = await readBody(request);

  if (cut) {
    reply.destroy();

    return;
  }

  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (
      value &&
      !["host", "connection", "content-length", "transfer-encoding"].includes(
        name
      )
    ) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const options: RequestInit = {
    headers,
    method: request.method ?? "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  };

  if (body.length) {
    options.body = body;
  }

  const response = await fetch(url, options);

  const output = Buffer.from(await response.arrayBuffer());

  const flush = () => {
    if (reply.destroyed) {
      return;
    }

    reply.statusCode = response.status;

    for (const [name, value] of response.headers) {
      if (
        ![
          "set-cookie",
          "connection",
          "transfer-encoding",
          "content-length",
        ].includes(name)
      ) {
        reply.setHeader(name, value);
      }
    }

    const cookies = response.headers.getSetCookie();

    if (cookies.length) {
      reply.setHeader("set-cookie", cookies);
    }

    reply.end(output);
  };

  if (nextPath === url.pathname) {
    nextPath = null;
    heldCount += 1;

    const deadline = setTimeout(() => {
      waiting = null;
      flush();
    }, 25_000);

    waiting = () => {
      clearTimeout(deadline);
      flush();
    };

    return;
  }

  flush();
};

const relay = createServer(async (request, reply) => {
  try {
    await (request.url === "/_army/control"
      ? control(request, reply)
      : forward(request, reply));
  } catch {
    if (!reply.headersSent && !reply.destroyed) {
      reply.writeHead(503).end();
    }
  }
});

relay.listen(4342, "127.0.0.1", () => {
  process.stdout.write("AUTH-003 local HTTP fault relay ready on 4342.\n");
});

process.once("SIGTERM", () => {
  waiting?.();
  relay.close();
});

process.once("SIGINT", () => {
  waiting?.();
  relay.close();
});
