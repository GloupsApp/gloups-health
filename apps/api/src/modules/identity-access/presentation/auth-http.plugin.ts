import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply } from "fastify";

import type { ApiConfig } from "../../../config.js";
import type { BetterAuthGateway } from "../infrastructure/auth/better-auth.gateway.js";
import { sendHttpError } from "./http-errors.js";

export const forwardAuthResponse = async (
  response: Response,
  reply: FastifyReply
) => {
  reply.status(response.status);

  for (const [key, value] of response.headers) {
    if (
      ![
        "set-cookie",
        "transfer-encoding",
        "connection",
        "content-length",
      ].includes(key)
    ) {
      reply.header(key, value);
    }
  }

  const retryAfter =
    response.headers.get("retry-after") ??
    response.headers.get("x-retry-after");

  if (response.status === 429 && retryAfter) {
    reply.header("retry-after", retryAfter);
  }

  const cookies = response.headers.getSetCookie();

  reply.header("cache-control", "no-store");

  if (cookies.length) {
    reply.header("set-cookie", cookies);
  }

  return reply.send(
    response.body ? Buffer.from(await response.arrayBuffer()) : null
  );
};

export const registerAuthHttp = async (
  instance: FastifyInstance,
  gateway: BetterAuthGateway,
  config: ApiConfig
): Promise<void> => {
  await instance.register((scope, _options, done) => {
    scope.removeAllContentTypeParsers();
    scope.addContentTypeParser(
      "*",
      { bodyLimit: 65_536, parseAs: "buffer" },
      (_request, body, parseDone) => {
        parseDone(null, body);
      }
    );
    scope.route<{
      Body: Buffer;
    }>({
      bodyLimit: 65_536,
      async handler(request, reply) {
        try {
          const headers = fromNodeHeaders(request.headers);
          headers.set("x-gloups-client-ip", request.ip);
          headers.delete("host");

          const init: NonNullable<ConstructorParameters<typeof Request>[1]> = {
            headers,
            method: request.method,
          };

          if (
            request.method !== "GET" &&
            request.method !== "HEAD" &&
            request.body
          ) {
            init.body = new Uint8Array(request.body);
          }

          const webRequest = new Request(
            `${config.baseURL}${request.url}`,
            init
          );

          const response = await gateway.handle(webRequest);

          return forwardAuthResponse(response, reply);
        } catch {
          return sendHttpError(reply, 503, "SERVICE_UNAVAILABLE");
        }
      },
      method: ["GET", "POST"],
      url: "/api/auth/*",
    });
    done();
  });
};
