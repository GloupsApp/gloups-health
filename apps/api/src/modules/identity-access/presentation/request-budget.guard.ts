import { Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";

import { ACCESS_RATE_LIMIT } from "../application/ports/rate-limit.port.js";
import type { AccessRateLimit } from "../application/ports/rate-limit.port.js";
import { HttpRateLimitedError } from "./http-rate-limit.js";

interface RequestBudgetRule {
  max: number;
  name: string;
  windowSeconds: number;
}

export const RequestBudget = Reflector.createDecorator<RequestBudgetRule>();

@Injectable()
export class RequestBudgetGuard implements CanActivate {
  private readonly reflector: Reflector;
  private readonly limits: AccessRateLimit;
  constructor(
    @Inject(Reflector) reflector: Reflector,
    @Inject(ACCESS_RATE_LIMIT) limits: AccessRateLimit
  ) {
    this.reflector = reflector;
    this.limits = limits;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.getAllAndOverride(RequestBudget, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rule) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const result = await this.limits.consume(request.ip, rule);

    if (!result.allowed) {
      throw new HttpRateLimitedError(result.retryAfterSeconds);
    }

    return true;
  }
}
