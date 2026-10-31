import type { IdentitySessions } from "@authentication/identity-sessions.port";
import type { Auth } from "@authentication/integrations/better-auth/auth";

export class BetterAuthSessions implements IdentitySessions {
  private readonly auth: Auth;
  constructor(auth: Auth) {
    this.auth = auth;
  }
  async verify(proof: string) {
    if (!proof) {
      return null;
    }

    const session = await this.auth.api.getSession({
      headers: new Headers({ cookie: proof }),
    });

    if (!session) {
      return null;
    }

    return {
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      id: session.user.id,
      name: session.user.name,
    };
  }
}
