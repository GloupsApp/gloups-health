import type { IncomingHttpHeaders } from "node:http";

import { Inject, Injectable } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";

import { DATABASE } from "../persistence/database.js";
import type { DatabaseResource } from "../persistence/database.js";
import { runAuthRequest } from "./auth-request-scope.js";
import { AUTH } from "./auth.js";
import type { Auth } from "./auth.js";
import { withIssuedProofLock } from "./issued-proof-lock.js";

export const trustedAuthHeaders = (
  input: IncomingHttpHeaders,
  clientIp: string
): Headers => {
  const headers = fromNodeHeaders(input);
  headers.set("x-gloups-client-ip", clientIp);
  headers.delete("host");

  return headers;
};

@Injectable()
export class BetterAuthGateway {
  private readonly auth: Auth;
  private readonly database: DatabaseResource;
  constructor(
    @Inject(AUTH) auth: Auth,
    @Inject(DATABASE) database: DatabaseResource
  ) {
    this.auth = auth;
    this.database = database;
  }
  handle(request: Request): Promise<Response> {
    return withIssuedProofLock(
      this.database.db,
      this.database.proofDb,
      request,
      this.auth,
      () =>
        runAuthRequest(new URL(request.url).pathname, () =>
          this.auth.handler(request)
        )
    );
  }
  setPassword(
    body: { newPassword: string },
    input: IncomingHttpHeaders,
    clientIp: string
  ): Promise<Response> {
    return runAuthRequest("/api/identity/password", () =>
      this.auth.api.setPassword({
        asResponse: true,
        body,
        headers: trustedAuthHeaders(input, clientIp),
      })
    );
  }
  signOut(input: IncomingHttpHeaders, clientIp: string): Promise<Response> {
    return this.auth.api.signOut({
      asResponse: true,
      headers: trustedAuthHeaders(input, clientIp),
    });
  }
}
