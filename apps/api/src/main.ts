import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CqrsModule } from "@nestjs/cqrs";
import { NodeAdapter } from "@nestjs/platform-node";
import type {
  NestNodeApplication,
  NodeRequest,
  NodeResponse,
} from "@nestjs/platform-node";

import { readConfig } from "./config.js";
import { DATABASE_READY, HealthController } from "./health.controller.js";
import { HttpErrors } from "./http-errors.filter.js";
import { AUTHENTICATION_HTTP } from "./modules/identity-access/authentication/public.js";
import type { AuthenticationHttpHandler } from "./modules/identity-access/authentication/public.js";
import { createIdentityAccess } from "./modules/identity-access/public.js";

const config = readConfig(process.env);
const identity = createIdentityAccess(config);

@Module({
  controllers: [HealthController],
  imports: [CqrsModule.forRoot(), identity.module],
  providers: [{ provide: DATABASE_READY, useValue: identity.ready }],
})
class AppModule {}

try {
  await identity.ready();

  const app = await NestFactory.create<NestNodeApplication>(
    AppModule,
    new NodeAdapter(),
    { bodyParser: false, logger: false }
  );

  app.enableCors({ credentials: true, origin: config.API_URL });
  app.use((_request: NodeRequest, response: NodeResponse, next: () => void) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(app.get<AuthenticationHttpHandler>(AUTHENTICATION_HTTP));
  app.useGlobalFilters(new HttpErrors());
  app.enableShutdownHooks();
  await app.listen(config.PORT, config.API_HOST);
  process.stdout.write(`Gloups API listening on ${config.PORT}\n`);
} catch {
  await identity.close();
  process.stderr.write("API startup failed\n");
  process.exitCode = 1;
}
