import type { IdentitySessions } from "./ports.js";

export class RevokeIdentitySessions {
  private readonly sessions: IdentitySessions;

  constructor(sessions: IdentitySessions) {
    this.sessions = sessions;
  }

  async execute(authUserId: string): Promise<void> {
    await this.sessions.revokeAll(authUserId);
  }
}
