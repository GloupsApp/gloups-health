import "reflect-metadata";
import { readConfig } from "@api/config";
import { HealthController } from "@api/health.controller";
import { HttpErrors } from "@api/http-errors.filter";
import { AUTHENTICATION_HTTP } from "@authentication/public";
import type { AuthenticationHttpHandler } from "@authentication/public";
import { DatabaseModule } from "@database/database.module";
import { createIdentityAccess } from "@identity-access/public";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CqrsModule } from "@nestjs/cqrs";
import { NodeAdapter } from "@nestjs/platform-node";
import type {
  NestNodeApplication,
  NodeRequest,
  NodeResponse,
} from "@nestjs/platform-node";

const config = readConfig(process.env);
const identity = createIdentityAccess(config);

@Module({
  controllers: [HealthController],
  imports: [
    CqrsModule.forRoot(),
    DatabaseModule.register(config),
    identity.module,
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
  await app?.close();
  process.stderr.write("API startup failed\n");
  process.exitCode = 1;
}
