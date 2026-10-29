import "reflect-metadata";
import { NestFactory } from "@nestjs/core";

import { IdentityDeletionWorkerModule } from "./modules/identity-access/composition/identity-deletion-worker.module.js";
import { DeletionWorkerService } from "./modules/identity-access/infrastructure/deletion/deletion-worker.service.js";

const main = async (): Promise<void> => {
  const app = await NestFactory.createApplicationContext(
    IdentityDeletionWorkerModule,
    { abortOnError: false, logger: false }
  );

  app.enableShutdownHooks();

  try {
    await app.get(DeletionWorkerService).run(process.argv.includes("--once"));
  } finally {
    await app.close();
  }
};

main().catch(() => {
  process.stderr.write("Authentication worker unavailable.\n");
  process.exitCode = 1;
});
