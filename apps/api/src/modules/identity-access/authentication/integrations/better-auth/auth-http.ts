import { authErrorSchema } from "@gloups/contracts";
import type { NodeRequest, NodeResponse } from "@nestjs/platform-node";
import { fromNodeHeaders } from "better-auth/node";

import type { ApiConfig } from "../../../../../config.js";
import type { Auth } from "./auth.js";

const AUTH_ROUTES = new Set([
  "GET /api/auth/ok",
  "GET /api/auth/get-session",
  "GET /api/auth/verify-email",
  "POST /api/auth/sign-up/email",
  "POST /api/auth/sign-in/email",
  "POST /api/auth/sign-out",
  "POST /api/auth/send-verification-email",
  "POST /api/auth/request-password-reset",
  "POST /api/auth/reset-password",
]);

const BODY_LIMIT = 65_536;

export const authHttp =
  (auth: Auth, config: ApiConfig) =>
  async (request: NodeRequest, response: NodeResponse, next: () => void) => {
    const url = new URL(request.url ?? "/", config.API_URL);

    if (!url.pathname.startsWith("/api/auth/")) {
      next();

      return;
    }

    const route = `${request.method} ${url.pathname}`;

    if (
      !AUTH_ROUTES.has(route) &&
      !(
        request.method === "GET" &&
        /^\/api\/auth\/reset-password\/[^/]+$/u.test(url.pathname)
      )
    ) {
      response
        .status(404)
        .json({ code: "NOT_FOUND", message: "Unknown authentication route" });

      return;
    }

    try {
      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of request) {
        const bytes = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(String(chunk));

        size += bytes.length;

        if (size > BODY_LIMIT) {
          response.status(413).json({
            code: "BODY_TOO_LARGE",
            message: "Request body too large",
          });

          return;
        }

        chunks.push(bytes);
      }

      const headers = fromNodeHeaders(request.headers);
      headers.set(
        "x-gloups-client-ip",
        request.socket.remoteAddress ?? "127.0.0.1"
      );
      const body = Buffer.concat(chunks);

      const options: RequestInit = { headers, method: request.method ?? "GET" };

      if (body.length > 0) {
        options.body = new Uint8Array(body);
      }

      const result = await auth.handler(new Request(url, options));

      response.statusCode = result.status;

      for (const [name, value] of result.headers) {
        if (name !== "set-cookie") {
          response.setHeader(name, value);
        }
      }

      const cookies = result.headers.getSetCookie();

      if (cookies.length > 0) {
        response.setHeader("set-cookie", cookies);
      }

      if (result.status === 429) {
        response.setHeader(
          "Retry-After",
          result.headers.get("x-retry-after") ?? "60"
        );
        response.end(
          JSON.stringify(
            authErrorSchema.parse({
              code: "TOO_MANY_REQUESTS",
              message: "Please wait before trying again.",
            })
          )
        );

        return;
      }

      response.end(Buffer.from(await result.arrayBuffer()));
    } catch {
      response.status(503).json({
        code: "SERVICE_UNAVAILABLE",
        message: "Authentication is temporarily unavailable",
      });
    }
  };
