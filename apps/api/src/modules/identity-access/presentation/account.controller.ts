/* oxlint-disable class-methods-use-this -- Nest transport contract. */
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { IdentityOnlyRoute } from "../../../platform/http/route-access.js";
import { RequestAccountDeletion } from "../application/request-account-deletion.js";
import type { VerifiedIdentity } from "../application/types.js";
import { BetterAuthGateway } from "../infrastructure/auth/better-auth.gateway.js";
import { CurrentIdentity } from "./current-identity.decorator.js";
import { IdempotencyKey } from "./idempotency-key.decorator.js";
import { TrustedOriginGuard } from "./trusted-origin.guard.js";
import { SchemaValidationPipe } from "./validation/schema-validation.pipe.js";

const deletionInput = z.object({ confirm: z.literal(true) }).strict();

@Controller("account")
@UseGuards(TrustedOriginGuard)
export class AccountController {
  private readonly command: RequestAccountDeletion;
  private readonly gateway: BetterAuthGateway;
  constructor(
    @Inject(RequestAccountDeletion) command: RequestAccountDeletion,
    @Inject(BetterAuthGateway) gateway: BetterAuthGateway
  ) {
    this.command = command;
    this.gateway = gateway;
  }
  @Delete()
  @HttpCode(202)
  @IdentityOnlyRoute()
  async remove(
    @Body(new SchemaValidationPipe(deletionInput)) _body: z.infer<
      typeof deletionInput
    >,
    @IdempotencyKey() key: string,
    @CurrentIdentity() actor: VerifiedIdentity,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const receipt = await this.command.execute(actor, { idempotencyKey: key });
    const response = await this.gateway.signOut(request.headers, request.ip);
    reply.header("set-cookie", response.headers.getSetCookie());

    return receipt;
  }
}
