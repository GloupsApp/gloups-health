import type { Database } from "../persistence/database.js";
import { withIdentityProofLock } from "../persistence/identity-proof-lock.js";
import { VerificationLedger } from "../persistence/verification-ledger.js";
import type { Auth } from "./auth.js";
import { verificationQuerySchema } from "./verification-policy.js";

export const withIssuedProofLock = async (
  db: Database,
  proofDb: Database,
  request: Request,
  auth: Auth,
  work: () => Promise<Response>
): Promise<Response> => {
  const url = new URL(request.url);
  let token: string | null = null;
  let kind: "verify-email" | "reset-password" = "verify-email";

  if (url.pathname === "/api/auth/verify-email") {
    token = url.searchParams.get("token");
  }

  if (url.pathname === "/api/auth/reset-password") {
    kind = "reset-password";

    try {
      const parsed = verificationQuerySchema.safeParse(
        await request.clone().json()
      );

      token = parsed.success ? parsed.data.token : null;
    } catch {
      /* SDK rejects malformed requests. */
    }
  }

  let issuer = token
    ? await new VerificationLedger(db).issuerFor(token, kind)
    : null;

  if (
    [
      "/api/auth/unlink-account",
      "/api/auth/change-password",
      "/api/auth/revoke-sessions",
      "/api/auth/revoke-other-sessions",
    ].includes(url.pathname)
  ) {
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    });

    issuer = session?.user.id ?? null;
  }

  if (!issuer) {
    return work();
  }

  return withIdentityProofLock(proofDb, issuer, work);
};
