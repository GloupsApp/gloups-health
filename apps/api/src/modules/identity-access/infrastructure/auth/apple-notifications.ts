import { createHash } from "node:crypto";

import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

import type { ApiConfig } from "../../../../config.js";
import { RevokeIdentitySessions } from "../../application/revoke-identity-sessions.js";
import { account } from "../persistence/auth-schema.js";
import type { Database } from "../persistence/database.js";
import { appleNotification } from "../persistence/provider-credentials-schema.js";
import type { Auth } from "./auth.js";
import { BetterAuthSessions } from "./session-adapter.js";

export const APPLE_NOTIFICATIONS = Symbol("APPLE_NOTIFICATIONS");

export const appleNotificationInput = z
  .object({ payload: z.string().min(1).max(16_384) })
  .strict();

const keys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

const eventSchema = z.object({
  event_time: z.number().int().positive(),
  sub: z.string().min(1),
  type: z.enum([
    "email-enabled",
    "email-disabled",
    "consent-revoked",
    "account-deleted",
  ]),
});

const notificationSchema = z.object({
  events: z.union([
    eventSchema,
    z.string().transform((value) => eventSchema.parse(JSON.parse(value))),
  ]),
  iat: z.number().int().positive(),
  jti: z.string().min(1).max(512),
});

export const createAppleNotifications = (
  config: ApiConfig,
  db: Database,
  auth: Auth
) => ({
  async process(payload: string): Promise<void> {
    if (!config.apple) {
      throw new ServiceUnavailableException();
    }

    let notification: z.infer<typeof notificationSchema>;

    try {
      const verified = await jwtVerify(payload, keys, {
        algorithms: ["RS256"],
        audience: [config.apple.bundleId, config.apple.serviceId],
        issuer: "https://appleid.apple.com",
        maxTokenAge: "24h",
      });

      notification = notificationSchema.parse(verified.payload);
      const now = Math.floor(Date.now() / 1000);

      if (
        notification.iat > now + 60 ||
        notification.events.event_time > now + 60
      ) {
        throw new Error("Invalid Apple notification time.");
      }
    } catch {
      throw new BadRequestException();
    }

    const id = createHash("sha256").update(notification.jti).digest("hex");
    await db.transaction(async (transaction) => {
      const inserted = await transaction
        .insert(appleNotification)
        .values({ id, processedAt: new Date() })
        .onConflictDoNothing()
        .returning({ id: appleNotification.id });

      if (
        !inserted.length ||
        !["consent-revoked", "account-deleted"].includes(
          notification.events.type
        )
      ) {
        return;
      }

      const [owner] = await transaction
        .select({ userId: account.userId })
        .from(account)
        .where(
          and(
            eq(account.providerId, "apple"),
            eq(account.accountId, notification.events.sub)
          )
        )
        .limit(1);

      if (owner) {
        await new RevokeIdentitySessions(
          new BetterAuthSessions(auth, transaction)
        ).execute(owner.userId);
      }
    });
  },
});

export type AppleNotifications = ReturnType<typeof createAppleNotifications>;
