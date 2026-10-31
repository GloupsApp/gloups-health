import "reflect-metadata";
import { ApiConfigModule } from "@api/api-config.module";
import { ApiConfig } from "@api/config";
import { HealthController } from "@api/health.controller";
import { HttpErrors } from "@api/http-errors.filter";
import { DatabaseModule } from "@database/database.module";
import { IdentityAccessModule } from "@identity-access/public";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CqrsModule } from "@nestjs/cqrs";
import { NodeAdapter } from "@nestjs/platform-node";
import type {
  NestNodeApplication,
  NodeRequest,
  NodeResponse,
} from "@nestjs/platform-node";
import { ObservabilityModule } from "@observability/public";

@Module({
  controllers: [HealthController],
  imports: [
    ApiConfigModule,
    CqrsModule.forRoot(),
    DatabaseModule,
    IdentityAccessModule,
    ObservabilityModule,
  ],
})
class AppModule {}

let app: NestNodeApplication | undefined;

try {
  app = await NestFactory.create<NestNodeApplication>(
    AppModule,
    new NodeAdapter(),
    { abortOnError: false, bodyParser: false, logger: false }
  );

  const config = app.get(ApiConfig);

  app.enableCors({ credentials: true, origin: config.API_URL });
  app.use((_request: NodeRequest, response: NodeResponse, next: () => void) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.useGlobalFilters(new HttpErrors());
  app.enableShutdownHooks();
  await app.listen(config.PORT, config.API_HOST);
  process.stdout.write(`Gloups API listening on ${config.PORT}\n`);
} catch {
  await app?.close();
  process.stderr.write("API startup failed\n");
  process.exitCode = 1;
}
