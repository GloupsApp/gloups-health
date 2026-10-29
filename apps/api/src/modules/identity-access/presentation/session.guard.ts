import { Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyReply, FastifyRequest } from "fastify";

import {
  IDENTITY_ONLY_ROUTE,
  PUBLIC_ROUTE,
} from "../../../platform/http/route-access.js";
import { IDENTITY_SESSIONS } from "../application/ports/identity-sessions.port.js";
import type { IdentitySessions } from "../application/ports/identity-sessions.port.js";
import { ACCESS_RATE_LIMIT } from "../application/ports/rate-limit.port.js";
import type { AccessRateLimit } from "../application/ports/rate-limit.port.js";
import { ResolveAccount } from "../application/resolve-account.js";
import { AccessFailureError } from "../application/types.js";
import type { AccountView, VerifiedIdentity } from "../application/types.js";
import { HttpRateLimitedError } from "./http-rate-limit.js";

export interface IdentityRequest extends FastifyRequest {
  verifiedIdentity?: VerifiedIdentity;
  gloups?: {
    readonly identity: VerifiedIdentity;
    readonly account: AccountView;
  };
}

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly reflector: Reflector;
  private readonly sessions: IdentitySessions;
  private readonly resolveAccount: ResolveAccount;
  private readonly limits: AccessRateLimit;
  constructor(
    @Inject(Reflector)
    reflector: Reflector,
    @Inject(IDENTITY_SESSIONS)
    sessions: IdentitySessions,
    @Inject(ResolveAccount)
    resolveAccount: ResolveAccount,
    @Inject(ACCESS_RATE_LIMIT)
    limits: AccessRateLimit
  ) {
    this.reflector = reflector;
    this.sessions = sessions;
    this.resolveAccount = resolveAccount;
    this.limits = limits;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    context
      .switchToHttp()
      .getResponse<FastifyReply>()
      .header("cache-control", "no-store");
    const request = context.switchToHttp().getRequest<IdentityRequest>();

    const budget = await this.limits.consume(request.ip, {
      max: 100,
      name: "application",
      windowSeconds: 60,
    });

    if (!budget.allowed) {
      throw new HttpRateLimitedError(budget.retryAfterSeconds);
    }

    const identity = await this.sessions.verify(request.headers.cookie ?? "");

    if (!identity) {
      throw new AccessFailureError("AUTH_REQUIRED");
    }

    request.verifiedIdentity = identity;

    if (
      this.reflector.getAllAndOverride<boolean>(IDENTITY_ONLY_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    request.gloups = {
      account: await this.resolveAccount.execute(identity),
      identity,
    };

    return true;
  }
}
