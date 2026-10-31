import { AccountsModule } from "@accounts/accounts.module";
import { Module } from "@nestjs/common";

@Module({ imports: [AccountsModule] })
export class IamModule {}
