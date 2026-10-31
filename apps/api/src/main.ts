import "reflect-metadata";
import { AppModule } from "@api/app.module";
import { ApiConfig } from "@api/config";
import { HttpErrors } from "@api/http-errors.filter";
import { NestFactory } from "@nestjs/core";
import { NodeAdapter } from "@nestjs/platform-node";
import type {
  NestNodeApplication,
  NodeRequest,
  NodeResponse,
} from "@nestjs/platform-node";

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
