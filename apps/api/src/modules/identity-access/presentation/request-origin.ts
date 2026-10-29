import { ForbiddenException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import type { ApiConfig } from "../../../config.js";

export const assertRequestOrigin = (
  request: FastifyRequest,
  config: ApiConfig
): void => {
  const origin = request.headers.origin ?? request.headers["expo-origin"];

  if (
    !origin ||
    Array.isArray(origin) ||
    !config.trustedOrigins.includes(origin)
  ) {
    throw new ForbiddenException();
  }
};
