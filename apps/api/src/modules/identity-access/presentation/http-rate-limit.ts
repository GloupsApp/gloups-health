export const HTTP_RATE_LIMIT = Symbol("HTTP_RATE_LIMIT");

export class HttpRateLimitedError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("RATE_LIMITED");
    this.retryAfterSeconds = retryAfterSeconds;
    this.name = "HttpRateLimitedError";
  }
}
