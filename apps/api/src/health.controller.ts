import { Public } from "@api/public-route.decorator";
import { DATABASE_READY } from "@database/database-readiness.port";
import { Controller, Get, Inject } from "@nestjs/common";

@Controller("healthz")
export class HealthController {
  private readonly ready: () => Promise<void>;

  constructor(@Inject(DATABASE_READY) ready: () => Promise<void>) {
    this.ready = ready;
  }

  @Get()
  @Public()
  async get() {
    await this.ready();

    return { status: "ok" };
  }
}
