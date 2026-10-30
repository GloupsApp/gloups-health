export class AccountAccessError extends Error {
  readonly code: "AUTH_REQUIRED" | "EMAIL_UNVERIFIED";
  constructor(code: "AUTH_REQUIRED" | "EMAIL_UNVERIFIED") {
    super(code);
    this.name = "AccountAccessError";
    this.code = code;
  }
}
