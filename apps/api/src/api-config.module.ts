import { ApiConfig, readConfig } from "@api/config";
import { Module } from "@nestjs/common";

@Module({
  exports: [ApiConfig],
  providers: [
    { provide: ApiConfig, useFactory: () => readConfig(process.env) },
  ],
})
export class ApiConfigModule {}
