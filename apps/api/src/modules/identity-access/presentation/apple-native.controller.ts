/* oxlint-disable class-methods-use-this -- Nest transport contract. */
import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";

import { PublicRoute } from "../../../platform/http/route-access.js";
import { AppleHttpGateway } from "../infrastructure/auth/apple-http.gateway.js";
import { forwardAuthResponse } from "./auth-http.plugin.js";
import { appleChallengeInput, nativeAppleInput } from "./dto/apple.inputs.js";
import { RequestBudget, RequestBudgetGuard } from "./request-budget.guard.js";
import { TrustedOriginGuard } from "./trusted-origin.guard.js";
import { SchemaValidationPipe } from "./validation/schema-validation.pipe.js";

@PublicRoute()
@Controller("identity/apple")
@UseGuards(TrustedOriginGuard, RequestBudgetGuard)
@RequestBudget({ max: 10, name: "native-apple", windowSeconds: 60 })
export class AppleNativeController {
  private readonly gateway: AppleHttpGateway;
  constructor(@Inject(AppleHttpGateway) gateway: AppleHttpGateway) {
    this.gateway = gateway;
  }
  @Post("challenges")
  challenge(
    @Body(new SchemaValidationPipe(appleChallengeInput)) input: z.infer<
      typeof appleChallengeInput
    >,
    @Req() request: FastifyRequest
  ) {
    return this.gateway.challenge(input, request.headers, request.ip);
  }
  @Post("native")
  async complete(
    @Body(new SchemaValidationPipe(nativeAppleInput)) input: z.infer<
      typeof nativeAppleInput
    >,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply
  ) {
    return forwardAuthResponse(
      await this.gateway.complete(input, request.headers, request.ip),
      reply
    );
  }
}
