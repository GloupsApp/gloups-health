import { AccountsModule } from "@accounts/accounts.module";
import type { ApiConfig } from "@api/config";
import { AuthenticationModule } from "@authentication/authentication.module";
import { Module } from "@nestjs/common";

// nestjs-doctor-ignore-next-line performance/no-orphan-modules -- main.ts imports the DynamicModule returned by createIdentityAccess() as identity.module.
@Module({})
class IdentityAccessModule {}

export const createIdentityAccess = (config: ApiConfig) => {
  const authentication = AuthenticationModule.register(config);
  const accounts = AccountsModule.register(authentication);

  return {
    module: {
      exports: [],
      imports: [authentication, accounts],
      module: IdentityAccessModule,
    },
  };
};
