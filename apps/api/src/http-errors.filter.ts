import { randomUUID } from "node:crypto";

import { apiErrorSchema } from "@gloups/contracts";
import type { ApiErrorCode } from "@gloups/contracts";
import { Catch, HttpException } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { NodeResponse } from "@nestjs/platform-node";
import { ZodError } from "zod";

import { AccountAccessError } from "./modules/identity-access/accounts/public.js";

export const sendError = (
  response: NodeResponse,
  status: number,
  code: ApiErrorCode
) => {
  response
    .status(status)
    .json(apiErrorSchema.parse({ error: { code, requestId: randomUUID() } }));
};

@Catch()
export class HttpErrors implements ExceptionFilter {
  // oxlint-disable-next-line class-methods-use-this, anti-slop/no-unknown-parameters -- Nest requires this exception-filter boundary to accept any thrown value.
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<NodeResponse>();

    if (error instanceof AccountAccessError) {
      sendError(
        response,
        error.code === "AUTH_REQUIRED" ? 401 : 403,
        error.code
      );
    } else if (error instanceof ZodError) {
      sendError(response, 400, "INVALID_REQUEST");
    } else if (error instanceof HttpException && error.getStatus() === 404) {
      sendError(response, 404, "NOT_FOUND");
    } else {
      sendError(response, 503, "SERVICE_UNAVAILABLE");
    }
  }
}
