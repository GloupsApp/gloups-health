import { AUTHENTICATION_HTTP } from "@authentication/authentication-http.port";
import type { AuthenticationHttpHandler } from "@authentication/authentication-http.port";
import { Inject, Injectable } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";
import type { NodeRequest, NodeResponse } from "@nestjs/platform-node";

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  private readonly handle: AuthenticationHttpHandler;
  constructor(@Inject(AUTHENTICATION_HTTP) handle: AuthenticationHttpHandler) {
    this.handle = handle;
  }
  use(request: NodeRequest, response: NodeResponse, next: () => void) {
    return this.handle(request, response, next);
  }
}
