import "reflect-metadata";
import cors from "@fastify/cors";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { sql } from "drizzle-orm";

import { AppModule } from "./app.module.js";
import { readConfig } from "./config.js";
import { AUTH } from "./modules/identity-access/infrastructure/auth/auth.js";
import type { Auth } from "./modules/identity-access/infrastructure/auth/auth.js";
import { DATABASE } from "./modules/identity-access/infrastructure/persistence/database.js";
import type { DatabaseResource } from "./modules/identity-access/infrastructure/persistence/database.js";
import { registerAuthHttp } from "./modules/identity-access/presentation/auth-http.plugin.js";
import { SafeHttpErrors } from "./modules/identity-access/presentation/http-errors.js";

const main = async (): Promise<void> => {
  const config = readConfig();

  const adapter = new FastifyAdapter({
    logger: false,
    trustProxy: false,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(config),
    adapter,
    { abortOnError: false, logger: false }
  );

  app.setGlobalPrefix("api", {
    exclude: [{ method: RequestMethod.GET, path: "healthz" }],
  });
  app.useGlobalFilters(new SafeHttpErrors());
  app.enableShutdownHooks();
  const instance = adapter.getInstance();
  await instance.register(cors, {
    allowedHeaders: ["Content-Type", "Cookie", "Idempotency-Key"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    origin: config.trustedOrigins.filter((origin) =>
      /^https?:\/\//u.test(origin)
    ),
  });
  const database = app.get<DatabaseResource>(DATABASE);
  await registerAuthHttp(instance, app.get<Auth>(AUTH), config, database);
  await database.db.execute(sql`select 1`);
  await app.listen(config.port, config.host);
  process.stdout.write(`Gloups API listening on port ${config.port}\n`);
};

main().catch(() => {
  process.stderr.write(
    "Gloups API startup failed. Check local configuration and database availability.\n"
  );
  process.exitCode = 1;
});
