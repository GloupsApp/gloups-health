/* oxlint-disable class-methods-use-this -- Nest invokes these instance handlers through its transport contract. */
import { Controller, Get } from "@nestjs/common";

import { PublicRoute } from "../http/route-access.js";

@Controller("healthz")
export class HealthController {
  @Get()
  @PublicRoute()
  getHealth() {
    return { status: "ok" };
  }
}
