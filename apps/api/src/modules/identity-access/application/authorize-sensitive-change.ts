import type { AccountUnitOfWork } from "./ports/account-unit-of-work.port.js";
import { AccessFailureError } from "./types.js";
import type { VerifiedIdentity } from "./types.js";

export class AuthorizeSensitiveChange {
  private readonly work: AccountUnitOfWork;
  private readonly nowMs: () => number;
  constructor(work: AccountUnitOfWork, nowMs: () => number) {
    this.work = work;
    this.nowMs = nowMs;
  }
  async execute(identity: VerifiedIdentity): Promise<void> {
    if (!identity.emailVerified) {
      throw new AccessFailureError("EMAIL_UNVERIFIED");
    }

    const ageMs = this.nowMs() - identity.authenticatedAtMs;

    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 300_000) {
      throw new AccessFailureError("FRESH_AUTH_REQUIRED");
    }

    await this.work.run(async ({ accounts }) => {
      const account = await accounts.findByIdentity(identity.authUserId);

      if (!account || account.isDeleting) {
        throw new AccessFailureError("ACCOUNT_DELETING");
      }
    });
  }
}
