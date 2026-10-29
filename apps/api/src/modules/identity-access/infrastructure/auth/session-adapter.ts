import { eq } from "drizzle-orm";

import type { IdentitySessions } from "../../application/ports/identity-sessions.port.js";
import type { VerifiedIdentity } from "../../application/types.js";
import { session } from "../persistence/auth-schema.js";
import type { Database } from "../persistence/database.js";
import type { Auth } from "./auth.js";

export class BetterAuthSessions implements IdentitySessions {
  private readonly auth: Auth;
  private readonly db: Pick<Database, "delete">;
  constructor(auth: Auth, db: Pick<Database, "delete">) {
    this.auth = auth;
    this.db = db;
  }
  async verify(proof: string): Promise<VerifiedIdentity | null> {
    if (!proof) {
      return null;
    }

    const result = await this.auth.api.getSession({
      headers: new Headers({ cookie: proof }),
      query: { disableCookieCache: true, disableRefresh: true },
    });

    if (!result) {
      return null;
    }

    return {
      authUserId: result.user.id,
      authenticatedAtMs: result.session.createdAt.getTime(),
      email: result.user.email,
      emailVerified: result.user.emailVerified,
      name: result.user.name,
      sessionId: result.session.id,
    };
  }
  async revokeAll(authUserId: string): Promise<void> {
    await this.db.delete(session).where(eq(session.userId, authUserId));
  }
}
