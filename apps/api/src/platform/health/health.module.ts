/* oxlint-disable typescript/no-extraneous-class -- Nest module composition. */
import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller.js";

@Module({ controllers: [HealthController] })
export class HealthModule {}
