/* oxlint-disable class-methods-use-this -- Nest invokes instance handlers through its transport contract. */
import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import {
  APPLE_NATIVE,
  appleChallengeInput,
  nativeAppleInput,
} from "../infrastructure/auth/apple-native.js";
import type { NativeApple } from "../infrastructure/auth/apple-native.js";
import type { DrizzleHttpRateLimit } from "../infrastructure/persistence/rate-limit.js";
import { forwardAuthResponse } from "./auth-http.plugin.js";
import { HTTP_RATE_LIMIT, HttpRateLimitedError } from "./http-rate-limit.js";
import { PublicRoute } from "./public-route.js";
import { assertRequestOrigin } from "./request-origin.js";

@PublicRoute()
@Controller("identity/apple")
export class AppleNativeController {
  private readonly native: NativeApple;
  private readonly config: ApiConfig;
  private readonly limits: DrizzleHttpRateLimit;
  constructor(
    @Inject(API_CONFIG) config: ApiConfig,
    @Inject(APPLE_NATIVE) native: NativeApple,
    @Inject(HTTP_RATE_LIMIT) limits: DrizzleHttpRateLimit
  ) {
    this.native = native;
    this.config = config;
    this.limits = limits;
  }
  private async headers(request: FastifyRequest) {
    assertRequestOrigin(request, this.config);

    const budget = await this.limits.consume(request.ip, {
      max: 10,
      name: "native-apple",
      windowSeconds: 60,
    });

    if (!budget.allowed) {
      throw new HttpRateLimitedError(budget.retryAfterSeconds);
    }

    const headers = fromNodeHeaders(request.headers);
    headers.set("x-gloups-client-ip", request.ip);
    headers.delete("host");

    return headers;
  }
  @Post("challenges")
  async challenge(
    @Body() body: z.input<typeof appleChallengeInput>,
    @Req() request: FastifyRequest
  ) {
    const parsed = appleChallengeInput.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException();
    }

    return this.native.challenge(parsed.data, await this.headers(request));
  }
  @Post("native")
  async complete(
    @Body() body: z.input<typeof nativeAppleInput>,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply
  ) {
    const parsed = nativeAppleInput.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException();
    }

    const response = await this.native.complete(
      parsed.data,
      await this.headers(request)
    );

    return forwardAuthResponse(response, reply);
  }
}
