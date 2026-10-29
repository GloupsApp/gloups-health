import { Inject, Injectable } from "@nestjs/common";
import type { OnModuleInit } from "@nestjs/common";
import { getDrizzleToken } from "@nestjs/drizzle";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class DatabaseReadiness implements OnModuleInit {
  private readonly db: PostgresJsDatabase;
  constructor(@Inject(getDrizzleToken("main")) db: PostgresJsDatabase) {
    this.db = db;
  }
  async onModuleInit(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }
}
