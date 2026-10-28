import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";

import { z } from "zod";

import { readConfig } from "../config.js";

const config = readConfig();

const messageSchema = z.object({
  kind: z.enum(["verify-email", "reset-password"]),
  language: z.enum(["en", "fr"]),
  recipient: z.email().endsWith(".test"),
  subject: z.string().max(200),
  text: z.string().max(16_384),
  url: z.url(),
});

const controlSchema = z.object({ reject: z.boolean() });

const messages: {
  message: z.infer<typeof messageSchema>;
  receiptId: string;
}[] = [];

const expected = createHash("sha256")
  .update(`Bearer ${config.emailSinkSecret}`)
  .digest();

let rejectDelivery = false;

const readBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer: Buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(String(chunk));

    size += buffer.length;

    if (size > 65_536) {
      throw new Error("Message too large.");
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf-8");
};

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");

  const supplied = createHash("sha256")
    .update(request.headers.authorization ?? "")
    .digest();

  if (!timingSafeEqual(supplied, expected)) {
    response.writeHead(401).end('{"error":"AUTH_REQUIRED"}');

    return;
  }

  try {
    if (request.url === "/messages" && request.method === "GET") {
      response.end(JSON.stringify({ messages }));

      return;
    }

    if (request.url === "/messages" && request.method === "DELETE") {
      messages.length = 0;
      response.end('{"cleared":true}');

      return;
    }

    if (request.url === "/control" && request.method === "POST") {
      const control = controlSchema.parse(JSON.parse(await readBody(request)));
      rejectDelivery = control.reject;
      response.end('{"updated":true}');

      return;
    }

    if (request.url === "/messages" && request.method === "POST") {
      if (rejectDelivery) {
        response.writeHead(503).end('{"error":"DELIVERY_UNAVAILABLE"}');

        return;
      }

      const message = messageSchema.parse(JSON.parse(await readBody(request)));
      const receiptId = randomUUID();
      messages.push({ message, receiptId });

      if (messages.length > 100) {
        messages.shift();
      }

      response
        .writeHead(202)
        .end(JSON.stringify({ accepted: true, receiptId }));

      return;
    }

    response.writeHead(404).end('{"error":"NOT_FOUND"}');
  } catch {
    response.writeHead(400).end('{"error":"INVALID_REQUEST"}');
  }
});

server.listen(Number(new URL(config.emailSinkURL).port), "127.0.0.1", () => {
  process.stdout.write("Local synthetic email sink ready.\n");
});

process.on("SIGTERM", () => {
  server.close();
});

process.on("SIGINT", () => {
  server.close();
});
