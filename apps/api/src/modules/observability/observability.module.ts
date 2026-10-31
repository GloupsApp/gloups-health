import { ApiConfigModule } from "@api/api-config.module";
import { ApiConfig } from "@api/config";
import { DATABASE_READY } from "@database/database-readiness.port";
import { DatabaseModule } from "@database/database.module";
import { Module, RequestMethod } from "@nestjs/common";
import type { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ApiMetrics } from "@observability/api-metrics";
import { ApiMetricsMiddleware } from "@observability/api-metrics.middleware";
import { HTTP_METRICS } from "@observability/http-metrics.port";
import type { ObserveHttpRequest } from "@observability/http-metrics.port";

@Module({
  imports: [ApiConfigModule, DatabaseModule],
  providers: [
    {
      inject: [ApiConfig, DATABASE_READY],
      provide: ApiMetrics,
      useFactory: (config: ApiConfig, ready: () => Promise<void>) =>
        new ApiMetrics(config, ready),
    },
    {
      inject: [ApiMetrics],
      provide: HTTP_METRICS,
      useFactory:
        (metrics: ApiMetrics): ObserveHttpRequest =>
        (request, response, next) =>
          metrics.observe(request, response, next),
    },
    ApiMetricsMiddleware,
  ],
})
export class ObservabilityModule implements NestModule {
  // oxlint-disable-next-line class-methods-use-this -- NestModule requires an instance configure hook.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiMetricsMiddleware).forRoutes({
      method: RequestMethod.ALL,
      path: "{*path}",
    });
  }
}
