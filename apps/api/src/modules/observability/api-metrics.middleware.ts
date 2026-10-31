import { Inject, Injectable } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";
import type { NodeRequest, NodeResponse } from "@nestjs/platform-node";
import { HTTP_METRICS } from "@observability/http-metrics.port";
import type { ObserveHttpRequest } from "@observability/http-metrics.port";

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private readonly observe: ObserveHttpRequest;

  constructor(@Inject(HTTP_METRICS) observe: ObserveHttpRequest) {
    this.observe = observe;
  }

  use(request: NodeRequest, response: NodeResponse, next: () => void) {
    this.observe(request, response, next);
  }
}
