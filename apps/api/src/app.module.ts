import { AccountsModule } from "@accounts/accounts.module";
import { ApiConfigModule } from "@api/api-config.module";
import { HealthController } from "@api/health.controller";
import { DatabaseModule } from "@database/database.module";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

@Module({
  controllers: [HealthController],
  imports: [
    AccountsModule,
    ApiConfigModule,
    CqrsModule.forRoot(),
    DatabaseModule,
  ],
})
export class AppModule {}
