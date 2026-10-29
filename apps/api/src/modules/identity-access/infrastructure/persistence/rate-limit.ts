import { createHmac } from "node:crypto";

import { sql } from "drizzle-orm";

import type { AccessRateLimit } from "../../application/ports/rate-limit.port.js";
import type { Database } from "./database.js";
import { httpRateLimit } from "./rate-limit-schema.js";

export class DrizzleHttpRateLimit implements AccessRateLimit {
  private readonly db: Database;
  private readonly secret: string;
  constructor(db: Database, secret: string) {
    this.db = db;
    this.secret = secret;
  }
  async consume(
    identity: string,
    rule: {
      name: string;
      max: number;
      windowSeconds: number;
    }
  ): Promise<{
    allowed: boolean;
    retryAfterSeconds: number;
  }> {
    const key = createHmac("sha256", this.secret)
      .update(`${rule.name}:${identity}`)
      .digest("hex");

    const now = new Date();
    const end = new Date(now.getTime() + rule.windowSeconds * 1000);

    const [row] = await this.db
      .insert(httpRateLimit)
      .values({ count: 1, key, windowEndsAt: end })
      .onConflictDoUpdate({
        set: {
          count: sql`case when ${httpRateLimit.windowEndsAt} <= ${now.toISOString()}::timestamptz then 1 else ${httpRateLimit.count} + 1 end`,
          windowEndsAt: sql`case when ${httpRateLimit.windowEndsAt} <= ${now.toISOString()}::timestamptz then ${end.toISOString()}::timestamptz else ${httpRateLimit.windowEndsAt} end`,
        },
        target: httpRateLimit.key,
      })
      .returning();

    if (!row) {
      throw new Error("Rate limit persistence failed.");
    }

    return {
      allowed: row.count <= rule.max,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((row.windowEndsAt.getTime() - now.getTime()) / 1000)
      ),
    };
  }
}
