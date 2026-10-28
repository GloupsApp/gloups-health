/* oxlint-disable class-methods-use-this -- Nest invokes instance handlers through its transport contract. */
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import type { z } from "zod";

import {
  APPLE_NOTIFICATIONS,
  appleNotificationInput,
} from "../infrastructure/auth/apple-notifications.js";
import type { AppleNotifications } from "../infrastructure/auth/apple-notifications.js";
import type { DrizzleHttpRateLimit } from "../infrastructure/persistence/rate-limit.js";
import { HTTP_RATE_LIMIT, HttpRateLimitedError } from "./http-rate-limit.js";
import { PublicRoute } from "./public-route.js";

@PublicRoute()
@Controller("identity/apple/notifications")
export class AppleNotificationsController {
  private readonly notifications: AppleNotifications;
  private readonly limits: DrizzleHttpRateLimit;
  constructor(
    @Inject(APPLE_NOTIFICATIONS) notifications: AppleNotifications,
    @Inject(HTTP_RATE_LIMIT) limits: DrizzleHttpRateLimit
  ) {
    this.notifications = notifications;
    this.limits = limits;
  }
  @Post()
  @HttpCode(204)
  async receive(
    @Body() body: z.input<typeof appleNotificationInput>,
    @Req() request: FastifyRequest
  ): Promise<void> {
    const parsed = appleNotificationInput.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException();
    }

    const budget = await this.limits.consume(request.ip, {
      max: 100,
      name: "apple-notifications",
      windowSeconds: 60,
    });

    if (!budget.allowed) {
      throw new HttpRateLimitedError(budget.retryAfterSeconds);
    }

    await this.notifications.process(parsed.data.payload);
  }
}
