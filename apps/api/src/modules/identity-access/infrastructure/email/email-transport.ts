import { APIError } from "better-auth/api";

import type {
  AuthEmail,
  EmailTransport,
} from "../../application/ports/auth-email.port.js";

export const deliverAuthEmail = async (
  transport: EmailTransport,
  message: AuthEmail
): Promise<void> => {
  try {
    const receipt = await transport.deliver(message);

    if (!receipt.accepted || !receipt.receiptId) {
      throw new Error("Auth email delivery was not accepted.");
    }
  } catch {
    throw new APIError("SERVICE_UNAVAILABLE", {
      code: "EMAIL_DELIVERY_UNAVAILABLE",
      message: "Email delivery unavailable. Try again later.",
    });
  }
};
