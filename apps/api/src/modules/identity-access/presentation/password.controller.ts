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
import type { FastifyReply } from "fastify";
import { z } from "zod";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { AuthorizeSensitiveChange } from "../application/authorize-sensitive-change.js";
import { AccessFailureError } from "../application/types.js";
import { AUTH } from "../infrastructure/auth/auth.js";
import type { Auth } from "../infrastructure/auth/auth.js";
import { runAuthRequest } from "../infrastructure/auth/lifecycle-hooks.js";
import { forwardAuthResponse } from "./auth-http.plugin.js";
import { assertRequestOrigin } from "./request-origin.js";
import type { IdentityRequest } from "./session.guard.js";

const inputSchema = z
  .object({ newPassword: z.string().min(15).max(128) })
  .strict();

@Controller("identity/password")
export class PasswordController {
  private readonly auth: Auth;
  private readonly sensitive: AuthorizeSensitiveChange;
  private readonly config: ApiConfig;
  constructor(
    @Inject(AUTH) auth: Auth,
    @Inject(AuthorizeSensitiveChange) sensitive: AuthorizeSensitiveChange,
    @Inject(API_CONFIG) config: ApiConfig
  ) {
    this.auth = auth;
    this.sensitive = sensitive;
    this.config = config;
  }
  @Post()
  async setPassword(
    @Body() body: z.input<typeof inputSchema>,
    @Req() request: IdentityRequest,
    @Res() reply: FastifyReply
  ) {
    assertRequestOrigin(request, this.config);
    const input = inputSchema.safeParse(body);

    if (!input.success) {
      throw new BadRequestException();
    }

    if (!request.gloups) {
      throw new AccessFailureError("AUTH_REQUIRED");
    }

    await this.sensitive.execute(request.gloups.identity);
    const headers = fromNodeHeaders(request.headers);
    headers.set("x-gloups-client-ip", request.ip);

    const response = await runAuthRequest("/api/identity/password", () =>
      this.auth.api.setPassword({ asResponse: true, body: input.data, headers })
    );

    return forwardAuthResponse(response, reply);
  }
}
