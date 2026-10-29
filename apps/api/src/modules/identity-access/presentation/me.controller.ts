/* oxlint-disable class-methods-use-this -- Nest transport contract. */
import { Controller, Get } from "@nestjs/common";

import type { AccountView } from "../application/types.js";
import { CurrentAccount } from "./current-identity.decorator.js";

@Controller("me")
export class MeController {
  @Get()
  getAccount(@CurrentAccount() account: AccountView): AccountView {
    return account;
  }
}
