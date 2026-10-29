import * as Network from "expo-network";
import { z } from "zod";

export type AuthFailureCode =
  | "invalid-credentials"
  | "email-unverified"
  | "fresh-auth-required"
  | "identity-conflict"
  | "invalid-link"
  | "rate-limited"
  | "offline"
  | "unavailable"
  | "cancelled"
  | "stale"
  | "apple-email-required"
  | "apple-unconfirmed";

export class AuthFailureError extends Error {
  readonly code: AuthFailureCode;
  readonly retryAfterSeconds: number | null;
  constructor(code: AuthFailureCode, retryAfterSeconds: number | null = null) {
    super(code);
    this.name = "AuthFailureError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const codes = {
  ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER: "identity-conflict",
  ACCOUNT_DELETING: "identity-conflict",
  ACCOUNT_NOT_LINKED: "identity-conflict",
  APPLE_EMAIL_REQUIRED: "apple-email-required",
  APPLE_SETUP_UNCONFIRMED: "apple-unconfirmed",
  EMAIL_NOT_VERIFIED: "email-unverified",
  EMAIL_UNVERIFIED: "email-unverified",
  FRESH_AUTH_REQUIRED: "fresh-auth-required",
  INVALID_EMAIL_OR_PASSWORD: "invalid-credentials",
  INVALID_TOKEN: "invalid-link",
  RATE_LIMITED: "rate-limited",
  SESSION_NOT_FRESH: "fresh-auth-required",
} satisfies Record<string, AuthFailureCode>;

// SAFETY: Object.keys comes directly from the nonempty, locally owned code map.
const codeSchema = z.enum(
  Object.keys(codes) as [keyof typeof codes, ...(keyof typeof codes)[]]
);

export const sdkFailure = (
  error: { status: number; code?: string | undefined },
  retryAfterSeconds: number | null = null
): AuthFailureError => {
  const parsed = codeSchema.safeParse(error.code);

  if (parsed.success) {
    return new AuthFailureError(codes[parsed.data], retryAfterSeconds);
  }

  if (error.status === 429) {
    return new AuthFailureError("rate-limited", retryAfterSeconds);
  }

  if (error.status === 401) {
    return new AuthFailureError("invalid-credentials");
  }

  if (error.status === 409) {
    return new AuthFailureError("identity-conflict");
  }

  return new AuthFailureError("unavailable");
};

const envelopeSchema = z.object({
  code: z.string().optional(),
  error: z
    .object({ code: z.string(), retryAfterSeconds: z.number().optional() })
    .optional(),
});

export const responseFailure = async (
  response: Response
): Promise<AuthFailureError> => {
  const parsed = envelopeSchema.safeParse(
    await response.json().catch(() => null)
  );

  return sdkFailure(
    {
      code: parsed.success
        ? (parsed.data.error?.code ?? parsed.data.code)
        : undefined,
      status: response.status,
    },
    parsed.success ? (parsed.data.error?.retryAfterSeconds ?? null) : null
  );
};

export const networkFailure = async (): Promise<AuthFailureError> => {
  try {
    const state = await Network.getNetworkStateAsync();

    return new AuthFailureError(
      state.isConnected === false || state.isInternetReachable === false
        ? "offline"
        : "unavailable"
    );
  } catch {
    return new AuthFailureError("unavailable");
  }
};

export const oauthCallbackFailure = (
  value: string | undefined
): AuthFailureError | null => {
  if (!value) {
    return null;
  }

  const parsed = z.string().min(1).max(128).safeParse(value);

  if (!parsed.success) {
    return new AuthFailureError("invalid-link");
  }

  const code = parsed.data.toUpperCase();

  if (
    [
      "ACCOUNT_NOT_LINKED",
      "ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER",
      "UNABLE_TO_LINK_ACCOUNT",
      "EMAIL_MISMATCH",
    ].includes(code)
  ) {
    return new AuthFailureError("identity-conflict");
  }

  if (code === "ACCESS_DENIED") {
    return new AuthFailureError("cancelled");
  }

  return new AuthFailureError("invalid-link");
};
