import { once } from "node:events";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { promisify } from "node:util";

import { emailMessageSchema } from "../apps/api/src/modules/iam/authentication/email-message.contract.ts";
import type { EmailMessage } from "../apps/api/src/modules/iam/authentication/email-message.contract.ts";

export const serverPort = (server: Server) => {
  const address = server.address();

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Narrow Node's address union for a TCP listener.
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP server");
  }

  return address.port;
};

export const createMailSink = async (token: string, port = 0) => {
  const messages: EmailMessage[] = [];
  let accepting = true;

  const server = createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");

    if (request.headers.authorization !== `Bearer ${token}`) {
      response.writeHead(401).end("{}");

      return;
    }

    if (request.method === "GET" && request.url === "/messages") {
      response.end(JSON.stringify(messages));

      return;
    }

    if (request.method !== "POST" || request.url !== "/messages") {
      response.writeHead(404).end("{}");

      return;
    }

    if (!accepting) {
      response.writeHead(503).end("{}");

      return;
    }

    try {
      let text = "";

      for await (const chunk of request) {
        text += String(chunk);

        if (text.length > 16_384) {
          response.writeHead(413).end("{}");

          return;
        }
      }

      const message = emailMessageSchema.parse(JSON.parse(text));

      if (!message.recipient.endsWith("@example.test")) {
        response.writeHead(400).end("{}");

        return;
      }

      messages.push(message);
      response.end(JSON.stringify({ accepted: true }));
    } catch {
      response.writeHead(400).end("{}");
    }
  });

  server.listen(port, "127.0.0.1");
  await once(server, "listening");

  return {
    close: () => promisify(server.close.bind(server))(),
    messages,
    setAccepting: (value: boolean) => {
      accepting = value;
    },
    url: `http://127.0.0.1:${serverPort(server)}/messages`,
  };
};
