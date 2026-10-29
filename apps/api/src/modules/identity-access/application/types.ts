export interface VerifiedIdentity {
  readonly authUserId: string;
  readonly sessionId: string;
  readonly authenticatedAtMs: number;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly name: string;
}

export interface AccountView {
  readonly account: {
    readonly id: string;
  };
  readonly user: {
    readonly name: string;
    readonly email: string;
    readonly emailVerified: boolean;
  };
}

export type AccessFailureErrorCode =
  | "AUTH_REQUIRED"
  | "EMAIL_UNVERIFIED"
  | "FRESH_AUTH_REQUIRED"
  | "ACCOUNT_DELETING"
  | "IDENTITY_CONFLICT";

export class AccessFailureError extends Error {
  readonly code: AccessFailureErrorCode;
  constructor(code: AccessFailureErrorCode) {
    super(code);
    this.code = code;
    this.name = "AccessFailureError";
  }
}
