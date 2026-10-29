/* oxlint-disable class-methods-use-this -- Nest transport contract. */
import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { z } from "zod";

import { PublicRoute } from "../../../platform/http/route-access.js";
import { AppleHttpGateway } from "../infrastructure/auth/apple-http.gateway.js";
import { appleNotificationInput } from "./dto/apple.inputs.js";
import { RequestBudget, RequestBudgetGuard } from "./request-budget.guard.js";
import { SchemaValidationPipe } from "./validation/schema-validation.pipe.js";

@PublicRoute()
@Controller("identity/apple/notifications")
@UseGuards(RequestBudgetGuard)
@RequestBudget({ max: 100, name: "apple-notifications", windowSeconds: 60 })
export class AppleNotificationsController {
  private readonly gateway: AppleHttpGateway;
  constructor(@Inject(AppleHttpGateway) gateway: AppleHttpGateway) {
    this.gateway = gateway;
  }
  @Post()
  @HttpCode(204)
  receive(
    @Body(new SchemaValidationPipe(appleNotificationInput)) input: z.infer<
      typeof appleNotificationInput
    >
  ): Promise<void> {
    return this.gateway.notify(input.payload);
  }
}
