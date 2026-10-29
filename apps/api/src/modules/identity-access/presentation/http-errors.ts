/* oxlint-disable class-methods-use-this -- Nest invokes instance handlers through its transport contract. */
import { Catch, HttpException } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AccessFailureError } from "../application/types.js";
import { HttpRateLimitedError } from "./http-rate-limit.js";

export type HttpErrorCode =
  | "AUTH_REQUIRED"
  | "EMAIL_UNVERIFIED"
  | "FRESH_AUTH_REQUIRED"
  | "ACCOUNT_DELETING"
  | "IDENTITY_CONFLICT"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "NOT_FOUND";

interface HttpErrorEnvelope {
  error: { code: HttpErrorCode; requestId: string; retryAfterSeconds?: number };
}

const accessStatuses = {
  ACCOUNT_DELETING: 403,
  AUTH_REQUIRED: 401,
  EMAIL_UNVERIFIED: 403,
  FRESH_AUTH_REQUIRED: 403,
  IDENTITY_CONFLICT: 409,
};

export const sendHttpError = (
  reply: FastifyReply,
  status: number,
  code: HttpErrorCode,
  retryAfterSeconds?: number
) => {
  const payload: HttpErrorEnvelope = {
    error: { code, requestId: reply.request.id },
  };

  if (retryAfterSeconds !== undefined) {
    reply.header("Retry-After", String(retryAfterSeconds));
    payload.error.retryAfterSeconds = retryAfterSeconds;
  }

  return reply.status(status).send(payload);
};

@Catch()
export class SafeHttpErrors implements ExceptionFilter<Error> {
  catch(error: Error, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();

    if (error instanceof AccessFailureError) {
      sendHttpError(reply, accessStatuses[error.code], error.code);

      return;
    }

    if (error instanceof HttpRateLimitedError) {
      sendHttpError(reply, 429, "RATE_LIMITED", error.retryAfterSeconds);

      return;
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      reply.status(status).send({
        error: {
          code: status === 404 ? "NOT_FOUND" : "INVALID_REQUEST",
          requestId: request.id,
        },
      });

      return;
    }

    sendHttpError(reply, 503, "SERVICE_UNAVAILABLE");
  }
}
