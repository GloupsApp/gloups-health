import { sql } from "drizzle-orm";

import type { Database } from "./database.js";

export const withIdentityProofLock = <T>(
  proofDb: Database,
  authUserId: string,
  work: () => Promise<T>
): Promise<T> =>
  proofDb.transaction(async (transaction) => {
    await transaction.execute(sql`set local lock_timeout = '5s'`);
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`proof:${authUserId}`}, 0))`
    );

    return work();
  });
