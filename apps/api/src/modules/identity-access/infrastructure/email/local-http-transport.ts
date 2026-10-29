import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import type {
  AuthEmail,
  EmailTransport,
} from "../../application/ports/auth-email.port.js";
import { renderAuthEmail } from "./templates.js";

const receiptSchema = z.object({
  accepted: z.literal(true),
  receiptId: z.uuid(),
});

const SYNTHETIC_EMAIL = /^[^@\s]+@[^@\s]+\.test$/u;

export class LocalHttpEmailTransport implements EmailTransport {
  private readonly config: ApiConfig;
  constructor(config: ApiConfig) {
    this.config = config;
  }
  async deliver(message: AuthEmail): Promise<{
    accepted: boolean;
    receiptId: string | null;
  }> {
    if (!SYNTHETIC_EMAIL.test(message.recipient)) {
      throw new Error("The local sink only accepts synthetic .test addresses.");
    }

    const response = await fetch(`${this.config.emailSinkURL}/messages`, {
      body: JSON.stringify({ ...message, ...renderAuthEmail(message) }),
      headers: {
        authorization: `Bearer ${this.config.emailSinkSecret}`,
        "content-type": "application/json",
      },
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error("Local email delivery unavailable.");
    }

    const result = receiptSchema.parse(await response.json());

    return { accepted: true, receiptId: result.receiptId };
  }
}
