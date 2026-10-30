import { Controller, Get, Inject } from "@nestjs/common";

export const DATABASE_READY = Symbol("DATABASE_READY");

@Controller("healthz")
export class HealthController {
  private readonly ready: () => Promise<void>;

  constructor(@Inject(DATABASE_READY) ready: () => Promise<void>) {
    this.ready = ready;
  }

  @Get()
  async get() {
    await this.ready();

    return { status: "ok" };
  }
}
