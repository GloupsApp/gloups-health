import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import { AppModule } from "./app.module.js";
import { API_CONFIG } from "./config.js";
import type { ApiConfig } from "./config.js";

const main = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: false }),
    {
      abortOnError: false,
      logger: false,
      routeConflictPolicy: { duplicate: "error" },
    }
  );

  try {
    const config = app.get<ApiConfig>(API_CONFIG);
    app.setGlobalPrefix("api", {
      exclude: [{ method: RequestMethod.GET, path: "healthz" }],
    });
    app.enableShutdownHooks();
    app.enableCors({
      allowedHeaders: ["Content-Type", "Cookie", "Idempotency-Key"],
      credentials: true,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      origin: config.trustedOrigins.filter((origin) =>
        /^https?:\/\//u.test(origin)
      ),
    });
    await app.listen(config.port, config.host);
    process.stdout.write(`Gloups API listening on port ${config.port}\n`);
  } catch (error) {
    await app.close();
    throw error;
  }
};

main().catch(() => {
  process.stderr.write(
    "Gloups API startup failed. Check local configuration and database availability.\n"
  );
  process.exitCode = 1;
});
