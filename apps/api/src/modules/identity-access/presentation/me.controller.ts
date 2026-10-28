/* oxlint-disable class-methods-use-this -- Nest invokes these instance handlers through its transport contract. */
import { Controller, Get, Req } from "@nestjs/common";

import { AccessFailureError } from "../application/types.js";
import type { AccountView } from "../application/types.js";
import type { IdentityRequest } from "./session.guard.js";

@Controller("me")
export class MeController {
  @Get()
  getAccount(
    @Req()
    request: IdentityRequest
  ): AccountView {
    if (!request.gloups) {
      throw new AccessFailureError("AUTH_REQUIRED");
    }

    return request.gloups.account;
  }
}
