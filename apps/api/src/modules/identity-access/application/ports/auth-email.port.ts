export interface AuthEmail {
  readonly recipient: string;
  readonly language: "en" | "fr";
  readonly kind: "verify-email" | "reset-password";
  readonly url: string;
}

export interface EmailTransport {
  deliver: (
    message: AuthEmail
  ) => Promise<{ accepted: boolean; receiptId: string | null }>;
}
