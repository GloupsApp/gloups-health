import { ApiConfigModule } from "@api/api-config.module";
import { HealthController } from "@api/health.controller";
import { DatabaseModule } from "@database/database.module";
import { IamModule } from "@iam/public";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

@Module({
  controllers: [HealthController],
  imports: [ApiConfigModule, CqrsModule.forRoot(), DatabaseModule, IamModule],
})
export class AppModule {}
