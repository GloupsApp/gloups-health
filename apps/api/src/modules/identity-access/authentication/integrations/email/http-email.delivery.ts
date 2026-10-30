import { z } from "zod";

import type { ApiConfig } from "../../../../../config.js";
import { emailMessageSchema } from "../../email-message.contract.js";
import type { EmailMessage } from "../../email-message.contract.js";

export interface EmailDelivery {
  deliver: (message: EmailMessage) => Promise<void>;
}

export class HttpEmailDelivery implements EmailDelivery {
  private readonly config: ApiConfig;
  constructor(config: ApiConfig) {
    this.config = config;
  }
  async deliver(message: EmailMessage) {
    try {
      const response = await fetch(this.config.EMAIL_DELIVERY_URL, {
        body: JSON.stringify(emailMessageSchema.parse(message)),
        headers: {
          authorization: `Bearer ${this.config.EMAIL_DELIVERY_TOKEN}`,
          "content-type": "application/json",
        },
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error("Email delivery unavailable");
      }

      z.strictObject({ accepted: z.literal(true) }).parse(
        await response.json()
      );
    } catch {
      process.stderr.write("AUTH_EMAIL_DELIVERY_FAILED\n");
      throw new Error("Email delivery unavailable");
    }
  }
}
