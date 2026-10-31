import { ApiConfig } from "@api/config";
import { Inject, Injectable } from "@nestjs/common";
import { APIError } from "better-auth/api";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTPayload, JWTVerifyGetKey } from "jose";
import { z } from "zod";

export interface ProviderKeys {
  apple: JWTVerifyGetKey;
  google: JWTVerifyGetKey;
}

export const PROVIDER_KEYS = Symbol("PROVIDER_KEYS");

export const createProviderKeys = (): ProviderKeys => ({
  apple: createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys")),
  google: createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs")
  ),
});

const eventTime = z.object({
  iat: z.number().int().positive(),
  jti: z.string().min(1),
});

@Injectable()
export class ProviderNotificationVerifier {
  private readonly config: ApiConfig;
  private readonly keys: ProviderKeys;

  constructor(
    @Inject(ApiConfig) config: ApiConfig,
    @Inject(PROVIDER_KEYS) keys: ProviderKeys
  ) {
    this.config = config;
    this.keys = keys;
  }

  async verify(
    provider: "apple" | "google",
    token: string
  ): Promise<JWTPayload & z.infer<typeof eventTime>> {
    const audience =
      provider === "apple"
        ? this.config.APPLE_CLIENT_ID
        : this.config.GOOGLE_CLIENT_ID;

    if (!audience) {
      throw new APIError("NOT_FOUND", {
        code: "PROVIDER_NOT_FOUND",
        message: "Provider is not configured",
      });
    }

    try {
      const { payload } = await jwtVerify(token, this.keys[provider], {
        algorithms: ["RS256"],
        audience,
        issuer:
          provider === "apple"
            ? "https://appleid.apple.com"
            : ["https://accounts.google.com", "https://accounts.google.com/"],
      });

      const claims = eventTime.parse(payload);

      if (claims.iat > Math.floor(Date.now() / 1000) + 60) {
        throw new Error("Future event");
      }

      return { ...payload, ...claims };
    } catch {
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_PROVIDER_EVENT",
        message: "Invalid provider notification",
      });
    }
  }
}
