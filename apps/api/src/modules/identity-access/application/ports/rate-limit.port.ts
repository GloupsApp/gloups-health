export const ACCESS_RATE_LIMIT = Symbol("ACCESS_RATE_LIMIT");

export interface AccessRateLimit {
  consume: (
    identity: string,
    rule: { name: string; max: number; windowSeconds: number }
  ) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
}
