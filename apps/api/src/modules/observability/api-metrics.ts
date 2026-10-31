import { once } from "node:events";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";

import type { ApiConfig } from "@api/config";
import type { OnApplicationBootstrap, OnModuleDestroy } from "@nestjs/common";
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "prom-client";

// Only fixed route names become labels. Unknown URLs share one series.
const routes = new Set([
  "/healthz",
  "/api/me",
  "/api/auth/ok",
  "/api/auth/get-session",
  "/api/auth/verify-email",
  "/api/auth/sign-up/email",
  "/api/auth/sign-in/email",
  "/api/auth/sign-out",
  "/api/auth/send-verification-email",
  "/api/auth/request-password-reset",
  "/api/auth/reset-password",
]);

const methods = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

const routeLabel = (url: string) => {
  const path = url.split("?")[0] ?? "/";

  if (routes.has(path)) {
    return path;
  }

  if (/^\/api\/auth\/reset-password\/[^/]+$/u.test(path)) {
    return "/api/auth/reset-password/:token";
  }

  return "unmatched";
};

export class ApiMetrics implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly config: ApiConfig;
  private readonly registry = new Registry();
  private readonly requests = new Counter({
    help: "Completed API HTTP requests.",
    labelNames: ["method", "route", "status_code"] as const,
    name: "gloups_api_http_requests_total",
    registers: [this.registry],
  });
  private readonly duration = new Histogram({
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    help: "API HTTP request duration in seconds, including authentication middleware.",
    labelNames: ["method", "route", "status_code"] as const,
    name: "gloups_api_http_request_duration_seconds",
    registers: [this.registry],
  });
  private readonly databaseReady: Gauge;
  private readonly server = createServer((request, response) => {
    this.scrape(request, response).catch(() => {
      response.statusCode = 503;
      response.end();
    });
  });

  constructor(config: ApiConfig, ready: () => Promise<void>) {
    this.config = config;
    this.databaseReady = new Gauge({
      collect: async () => {
        try {
          await ready();
          this.databaseReady.set(1);
        } catch {
          this.databaseReady.set(0);
        }
      },
      help: "Whether the API database readiness query succeeds (1 ready, 0 unavailable).",
      name: "gloups_api_database_ready",
      registers: [this.registry],
    });
    collectDefaultMetrics({ prefix: "gloups_api_", register: this.registry });
    this.server.requestTimeout = 5000;
    this.server.headersTimeout = 5000;
    this.server.maxConnections = 10;
  }

  async onApplicationBootstrap() {
    this.server.listen(this.config.METRICS_PORT, "127.0.0.1");
    await once(this.server, "listening");
  }

  async onModuleDestroy() {
    if (this.server.listening) {
      await promisify(this.server.close.bind(this.server))();
    }
  }

  observe(
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void
  ) {
    const started = performance.now();
    const method = methods.has(request.method ?? "") ? request.method : "OTHER";
    const route = routeLabel(request.url ?? "/");

    response.once("finish", () => {
      const labels = {
        method: method ?? "OTHER",
        route,
        status_code: response.statusCode,
      };

      this.requests.inc(labels);
      this.duration.observe(labels, (performance.now() - started) / 1000);
    });
    next();
  }

  private async scrape(request: IncomingMessage, response: ServerResponse) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");

    if (request.method !== "GET" || request.url !== "/metrics") {
      response.statusCode = 404;
      response.end();

      return;
    }

    response.setHeader("Content-Type", this.registry.contentType);
    response.end(await this.registry.metrics());
  }
}
