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
import { z } from "zod";

import { AuthorizeSensitiveChange } from "../application/authorize-sensitive-change.js";
import type { VerifiedIdentity } from "../application/types.js";
import { BetterAuthGateway } from "../infrastructure/auth/better-auth.gateway.js";
import { forwardAuthResponse } from "./auth-http.plugin.js";
import { CurrentIdentity } from "./current-identity.decorator.js";
import { TrustedOriginGuard } from "./trusted-origin.guard.js";
import { SchemaValidationPipe } from "./validation/schema-validation.pipe.js";

const passwordInput = z
  .object({ newPassword: z.string().min(15).max(128) })
  .strict();

@Controller("identity/password")
@UseGuards(TrustedOriginGuard)
export class PasswordController {
  private readonly gateway: BetterAuthGateway;
  private readonly sensitive: AuthorizeSensitiveChange;
  constructor(
    @Inject(BetterAuthGateway) gateway: BetterAuthGateway,
    @Inject(AuthorizeSensitiveChange) sensitive: AuthorizeSensitiveChange
  ) {
    this.gateway = gateway;
    this.sensitive = sensitive;
  }
  @Post()
  async setPassword(
    @Body(new SchemaValidationPipe(passwordInput)) body: z.infer<
      typeof passwordInput
    >,
    @CurrentIdentity() actor: VerifiedIdentity,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply
  ) {
    await this.sensitive.execute(actor);

    return forwardAuthResponse(
      await this.gateway.setPassword(body, request.headers, request.ip),
      reply
    );
  }
}
