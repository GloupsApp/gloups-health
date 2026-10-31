import type { ProviderNotificationVerifier } from "@authentication/integrations/better-auth/provider-notification-verifier";
import type { SecurityStore } from "@authentication/integrations/better-auth/security-store";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { z } from "zod";

const appleEvent = z.object({
  event_time: z.number().optional(),
  sub: z.string().min(1),
  type: z.string(),
});

const googleEvent = z.object({
  subject: z.object({
    iss: z.enum([
      "https://accounts.google.com",
      "https://accounts.google.com/",
    ]),
    sub: z.string().min(1),
    subject_type: z.literal("iss-sub"),
  }),
});

const risc = "https://schemas.openid.net/secevent/";

const revokingEvents = new Set([
  `${risc}oauth/event-type/tokens-revoked`,
  `${risc}risc/event-type/sessions-revoked`,
  `${risc}risc/event-type/account-disabled`,
  `${risc}risc/event-type/account-enabled`,
  `${risc}risc/event-type/account-credential-change-required`,
]);

export const providerNotifications = (
  store: SecurityStore,
  verifier: ProviderNotificationVerifier
) => ({
  endpoints: {
    appleNotification: createAuthEndpoint(
      "/provider-notifications/apple",
      {
        body: z.object({ payload: z.string() }),
        method: "POST",
      },
      async (ctx) => {
        const payload = await verifier.verify("apple", ctx.body.payload);
        let event;

        try {
          const parsed = z.string().safeParse(payload["events"]);
          event = appleEvent.parse(
            parsed.success ? JSON.parse(parsed.data) : payload["events"]
          );
        } catch {
          throw new APIError("BAD_REQUEST", {
            code: "INVALID_PROVIDER_EVENT",
            message: "Invalid Apple event",
          });
        }

        if (["consent-revoked", "account-deleted"].includes(event.type)) {
          await store.revokeProvider(
            "apple",
            event.sub,
            new Date(payload.iat * 1000),
            event.type === "account-deleted"
          );
        }

        return ctx.json({ accepted: true });
      }
    ),
    googleNotification: createAuthEndpoint(
      "/provider-notifications/google",
      {
        body: z.object({ token: z.string() }),
        method: "POST",
      },
      async (ctx) => {
        const payload = await verifier.verify("google", ctx.body.token);

        const events = z
          .record(z.string(), z.unknown())
          .safeParse(payload["events"]);

        if (!events.success) {
          throw new APIError("BAD_REQUEST", {
            code: "INVALID_PROVIDER_EVENT",
            message: "Invalid Google event",
          });
        }

        const affected = Object.entries(events.data)
          .filter(([type]) => revokingEvents.has(type))
          .map(([type, value]) => ({
            disabled:
              type.endsWith("/account-disabled") ||
              type.endsWith("/account-credential-change-required"),
            event: googleEvent.safeParse(value),
          }));

        if (affected.some(({ event }) => !event.success)) {
          throw new APIError("BAD_REQUEST", {
            code: "INVALID_PROVIDER_EVENT",
            message: "Invalid Google subject",
          });
        }

        await Promise.all(
          affected.map(async ({ disabled, event }) => {
            if (event.success) {
              await store.revokeProvider(
                "google",
                event.data.subject.sub,
                new Date(payload.iat * 1000),
                disabled
              );
            }
          })
        );

        ctx.setStatus(202);

        return ctx.json({ accepted: true });
      }
    ),
  },
  id: "gloups-provider-notifications",
});
