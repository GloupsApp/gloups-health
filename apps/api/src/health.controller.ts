import { Controller, Get, Inject } from "@nestjs/common";

export const DATABASE_READY = Symbol("DATABASE_READY");

@Controller("healthz")
export class HealthController {
  private readonly ready: () => Promise<void>;

  constructor(@Inject(DATABASE_READY) ready: () => Promise<void>) {
    this.ready = ready;
  }

  // nestjs-doctor-ignore-next-line security/require-guards-on-endpoints -- Public readiness probe for infrastructure; returns only database readiness, never account data.
  @Get()
  async get() {
    await this.ready();

    return { status: "ok" };
  }
}
