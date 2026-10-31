import type { ApiConfig } from "@api/config";
import type { SecurityStore } from "@authentication/integrations/better-auth/security-store";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTVerifyGetKey } from "jose";
import { z } from "zod";

export interface ProviderKeys {
  apple: JWTVerifyGetKey;
  google: JWTVerifyGetKey;
}

const defaultKeys: ProviderKeys = {
  apple: createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys")),
  google: createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs")
  ),
};

const eventTime = z.object({
  iat: z.number().int().positive(),
  jti: z.string().min(1),
});

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
  config: ApiConfig,
  store: SecurityStore,
  keys = defaultKeys
) => {
  const verify = async (provider: "apple" | "google", token: string) => {
    const audience =
      provider === "apple" ? config.APPLE_CLIENT_ID : config.GOOGLE_CLIENT_ID;

    if (!audience) {
      throw new APIError("NOT_FOUND", {
        code: "PROVIDER_NOT_FOUND",
        message: "Provider is not configured",
      });
    }

    try {
      const { payload } = await jwtVerify(token, keys[provider], {
        algorithms: ["RS256"],
        audience,
        issuer:
          provider === "apple"
            ? "https://appleid.apple.com"
            : ["https://accounts.google.com", "https://accounts.google.com/"],
      });

      const { iat } = eventTime.parse(payload);

      if (iat > Math.floor(Date.now() / 1000) + 60) {
        throw new Error("Future event");
      }

      return payload;
    } catch {
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_PROVIDER_EVENT",
        message: "Invalid provider notification",
      });
    }
  };

  return {
    endpoints: {
      appleNotification: createAuthEndpoint(
        "/provider-notifications/apple",
        {
          body: z.object({ payload: z.string() }),
          method: "POST",
        },
        async (ctx) => {
          const payload = await verify("apple", ctx.body.payload);
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
              new Date(eventTime.parse(payload).iat * 1000),
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
          const payload = await verify("google", ctx.body.token);

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
                  new Date(eventTime.parse(payload).iat * 1000),
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
  };
};
