/* oxlint-disable class-methods-use-this -- Nest invokes instance handlers through its transport contract. */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Inject,
  Req,
  Res,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply } from "fastify";
import { z } from "zod";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { RequestAccountDeletion } from "../application/request-account-deletion.js";
import { AccessFailureError } from "../application/types.js";
import { AUTH } from "../infrastructure/auth/auth.js";
import type { Auth } from "../infrastructure/auth/auth.js";
import { IdentityOnlyRoute } from "./public-route.js";
import { assertRequestOrigin } from "./request-origin.js";
import type { IdentityRequest } from "./session.guard.js";

const deletionInput = z.object({ confirm: z.literal(true) }).strict();
const keySchema = z.uuid();

@Controller("account")
export class AccountController {
  private readonly command: RequestAccountDeletion;
  private readonly auth: Auth;
  private readonly config: ApiConfig;
  constructor(
    @Inject(RequestAccountDeletion) command: RequestAccountDeletion,
    @Inject(AUTH) auth: Auth,
    @Inject(API_CONFIG) config: ApiConfig
  ) {
    this.command = command;
    this.auth = auth;
    this.config = config;
  }
  @Delete()
  @IdentityOnlyRoute()
  async remove(
    @Body() body: z.input<typeof deletionInput>,
    @Req() request: IdentityRequest,
    @Res() reply: FastifyReply
  ) {
    assertRequestOrigin(request, this.config);
    const input = deletionInput.safeParse(body);
    const key = keySchema.safeParse(request.headers["idempotency-key"]);

    if (!input.success || !key.success) {
      throw new BadRequestException();
    }

    const actor = request.verifiedIdentity;

    if (!actor) {
      throw new AccessFailureError("AUTH_REQUIRED");
    }

    const receipt = await this.command.execute(actor, {
      idempotencyKey: key.data,
    });

    const headers = fromNodeHeaders(request.headers);
    headers.set("x-gloups-client-ip", request.ip);

    const signedOut = await this.auth.api.signOut({
      asResponse: true,
      headers,
    });

    reply.header("set-cookie", signedOut.headers.getSetCookie());

    return reply.status(202).send(receipt);
  }
}
