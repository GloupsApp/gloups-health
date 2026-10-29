import { Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { assertRequestOrigin } from "./request-origin.js";

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  private readonly config: ApiConfig;
  constructor(@Inject(API_CONFIG) config: ApiConfig) {
    this.config = config;
  }
  canActivate(context: ExecutionContext): boolean {
    assertRequestOrigin(
      context.switchToHttp().getRequest<FastifyRequest>(),
      this.config
    );

    return true;
  }
}
