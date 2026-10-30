import { IDENTITY_DATABASE } from "@database/public";
import type { Database } from "@database/public";
import { Injectable } from "@nestjs/common";
import type { OnModuleInit } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { sql } from "drizzle-orm";

@Injectable()
export class DrizzleReadiness implements OnModuleInit {
  private readonly database: Database;
  constructor(@InjectDrizzle(IDENTITY_DATABASE) database: Database) {
    this.database = database;
  }
  onModuleInit() {
    return this.ready();
  }
  async ready(): Promise<void> {
    await this.database.execute(sql`select 1`);
  }
}
