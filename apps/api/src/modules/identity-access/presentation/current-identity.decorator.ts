import { createParamDecorator } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";

import { AccessFailureError } from "../application/types.js";
import type { AccountView, VerifiedIdentity } from "../application/types.js";
import type { IdentityRequest } from "./session.guard.js";

export const CurrentIdentity = createParamDecorator(
  (_data: undefined, context: ExecutionContext): VerifiedIdentity => {
    const actor = context
      .switchToHttp()
      .getRequest<IdentityRequest>().verifiedIdentity;

    if (!actor) {
      throw new AccessFailureError("AUTH_REQUIRED");
    }

    return actor;
  }
);

export const CurrentAccount = createParamDecorator(
  (_data: undefined, context: ExecutionContext): AccountView => {
    const view = context.switchToHttp().getRequest<IdentityRequest>()
      .gloups?.account;

    if (!view) {
      throw new AccessFailureError("AUTH_REQUIRED");
    }

    return view;
  }
);
