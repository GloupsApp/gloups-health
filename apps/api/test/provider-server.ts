// Disposable provider transport for Army. This entry point is never used by main.ts.
import "reflect-metadata";
import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";

import { AppModule } from "@api/app.module";
import { ApiConfig } from "@api/config";
import { HttpErrors } from "@api/http-errors.filter";
import { AUTHENTICATION_HTTP } from "@authentication/authentication-http.port";
import { IdentitySessions } from "@authentication/identity-sessions.port";
import { createAuth } from "@authentication/integrations/better-auth/auth";
import type { Auth } from "@authentication/integrations/better-auth/auth";
import { authHttp } from "@authentication/integrations/better-auth/auth-http";
import {
  PROVIDER_KEYS,
  ProviderNotificationVerifier,
} from "@authentication/integrations/better-auth/provider-notification-verifier";
import type { ProviderKeys } from "@authentication/integrations/better-auth/provider-notification-verifier";
import { BetterAuthSessions } from "@authentication/integrations/better-auth/sessions";
import { HttpEmailDelivery } from "@authentication/integrations/email/http-email.delivery";
import { IDENTITY_DATABASE } from "@database/public";
import type { Database } from "@database/public";
import { getDrizzleToken } from "@nestjs/drizzle";
import { NodeAdapter } from "@nestjs/platform-node";
import type {
  NestNodeApplication,
  NodeRequest,
  NodeResponse,
} from "@nestjs/platform-node";
import { Test } from "@nestjs/testing";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  jwtVerify,
  SignJWT,
} from "jose";
import { z } from "zod";

const { privateKey, publicKey } = await generateKeyPair("RS256");

const jwks = createLocalJWKSet({
  keys: [{ ...(await exportJWK(publicKey)), kid: "army" }],
});

const authorizations = new Map<string, { challenge: string; token: string }>();

const issuer = (provider: string) =>
  provider === "apple"
    ? "https://appleid.apple.com"
    : "https://accounts.google.com";

const audience = (provider: string) => `army-${provider}`;
const mobileIdentity = randomUUID();
let engine: Promise<Auth> | undefined;

const getAuth = (
  database: Database,
  config: ApiConfig,
  verifier: ProviderNotificationVerifier
) => {
  engine ??= (async () => {
    const auth = createAuth(
      database,
      config,
      new HttpEmailDelivery(config),
      verifier
    );

    const context = await auth.$context;
    context.socialProviders = context.socialProviders.map((provider) => ({
      ...provider,
      createAuthorizationURL: ({
        state,
        codeVerifier,
        redirectURI,
        idTokenNonce,
      }) => {
        const url = new URL("/__fixture/authorize", config.API_URL);
        url.search = new URLSearchParams({
          challenge: createHash("sha256")
            .update(codeVerifier ?? "")
            .digest("base64url"),
          nonce: idTokenNonce ?? "",
          provider: provider.id,
          redirect_uri: redirectURI,
          state,
        }).toString();

        return Promise.resolve(url);
      },
      getUserInfo: async ({ idToken, expectedIdTokenNonce }) => {
        assert.ok(idToken);

        const { payload } = await jwtVerify(idToken, jwks, {
          algorithms: ["RS256"],
          audience: audience(provider.id),
          issuer: issuer(provider.id),
        });

        assert.equal(payload["nonce"], expectedIdTokenNonce);

        const profile = z
          .object({
            email: z.email().optional(),
            email_verified: z.boolean(),
            name: z.string().default(""),
            sub: z.string(),
          })
          .parse(payload);

        const mapped = await provider.options?.mapProfileToUser?.(payload);
        const email = mapped?.email ?? profile.email;

        if (!email) {
          return null;
        }

        return {
          data: payload,
          user: {
            email,
            emailVerified: profile.email_verified,
            name: profile.name,
          },
        };
      },
      requiresIdTokenNonce: true,
      validateAuthorizationCode: ({ code, codeVerifier }) => {
        const authorization = authorizations.get(code);
        authorizations.delete(code);
        assert.ok(authorization);
        assert.equal(
          createHash("sha256")
            .update(codeVerifier ?? "")
            .digest("base64url"),
          authorization.challenge
        );

        return Promise.resolve({ idToken: authorization.token });
      },
    }));

    return auth;
  })();

  return engine;
};

const fixture = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(PROVIDER_KEYS)
  .useValue({ apple: jwks, google: jwks } satisfies ProviderKeys)
  .overrideProvider(AUTHENTICATION_HTTP)
  .useFactory({
    factory: async (
      database: Database,
      config: ApiConfig,
      verifier: ProviderNotificationVerifier
    ) => {
      const handler = authHttp(
        await getAuth(database, config, verifier),
        config
      );

      return (
        request: NodeRequest,
        response: NodeResponse,
        next: () => void
      ) => {
        const url = new URL(request.url ?? "/", config.API_URL);

        // Only this disposable fixture supports a local HTTP authorization page.
        // Production keeps the Expo proxy's HTTPS requirement.
        if (url.pathname === "/api/auth/expo-authorization-proxy") {
          const authorization = new URL(
            url.searchParams.get("authorizationURL") ?? "invalid"
          );

          assert.equal(authorization.origin, config.API_URL);
          assert.equal(authorization.pathname, "/__fixture/authorize");
          const state = authorization.searchParams.get("state");
          assert.ok(state);

          const signature = createHmac("sha256", config.AUTH_SECRET)
            .update(state)
            .digest("base64");

          response.setHeader(
            "set-cookie",
            `gloups.state=${encodeURIComponent(`${state}.${signature}`)}; Path=/; HttpOnly; SameSite=Lax`
          );
          response.status(302).setHeader("location", authorization.toString());
          response.end();

          return Promise.resolve();
        }

        return handler(request, response, next);
      };
    },
    inject: [
      getDrizzleToken(IDENTITY_DATABASE),
      ApiConfig,
      ProviderNotificationVerifier,
    ],
  })
  .overrideProvider(IdentitySessions)
  .useFactory({
    factory: async (
      database: Database,
      config: ApiConfig,
      verifier: ProviderNotificationVerifier
    ) => new BetterAuthSessions(await getAuth(database, config, verifier)),
    inject: [
      getDrizzleToken(IDENTITY_DATABASE),
      ApiConfig,
      ProviderNotificationVerifier,
    ],
  })
  .compile();

const app = fixture.createNestApplication<NestNodeApplication>(
  new NodeAdapter(),
  { bodyParser: false, logger: false }
);

const config = app.get(ApiConfig);

app.use((request: NodeRequest, response: NodeResponse, next: () => void) => {
  response.setHeader("Cache-Control", "no-store");

  if (request.url?.startsWith("/api/auth/callback/")) {
    response.once("finish", () => {
      const location = response.getHeader("location");
      const parsed = z.string().safeParse(location);

      const outcome = parsed.success
        ? (new URL(parsed.data, config.API_URL).searchParams.get("error") ??
          "success")
        : "no_redirect";

      process.stderr.write(`Synthetic provider callback: ${outcome}\n`);
    });
  }

  next();
});

app.use((request: NodeRequest, response: NodeResponse, next: () => void) => {
  const url = new URL(request.url ?? "/", config.API_URL);

  if (!url.pathname.startsWith("/__fixture/")) {
    next();

    return;
  }

  void (async () => {
    const provider = z
      .enum(["apple", "google"])
      .parse(url.searchParams.get("provider"));

    if (url.pathname === "/__fixture/sign-event") {
      const payload = z
        .record(z.string(), z.unknown())
        .parse(JSON.parse(url.searchParams.get("payload") ?? "{}"));

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "RS256", kid: "army" })
        .setIssuer(issuer(provider))
        .setAudience(url.searchParams.get("audience") ?? audience(provider))
        .setIssuedAt()
        .setJti(randomUUID())
        .sign(privateKey);

      response.json({ token });

      return;
    }

    if (!url.searchParams.has("email") && !url.searchParams.has("error")) {
      const fields = new URLSearchParams(url.searchParams);
      fields.set("email", `${provider}-${mobileIdentity}@example.test`);
      fields.set("subject", `${provider}-${mobileIdentity}`);

      const hidden = [...fields]
        .map(
          ([name, value]) =>
            `<input type="hidden" name="${name}" value="${value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">`
        )
        .join("");

      const label = provider === "apple" ? "Apple" : "Google";
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(
        `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body><h1>Synthetic ${label} provider</h1><form>${hidden}<p><button>Use synthetic ${label}</button></p><p><button name="error" value="access_denied">Cancel provider</button></p></form></body></html>`
      );

      return;
    }

    const callback = new URL(
      z.url().parse(url.searchParams.get("redirect_uri"))
    );

    callback.searchParams.set("state", url.searchParams.get("state") ?? "");

    if (url.searchParams.has("error")) {
      callback.searchParams.set(
        "error",
        url.searchParams.get("error") ?? "access_denied"
      );
    } else {
      const email = z.email().parse(url.searchParams.get("email"));
      assert.ok(email.endsWith("@example.test"));
      const code = randomUUID();

      const token = await new SignJWT({
        email: url.searchParams.has("omit_email") ? undefined : email,
        email_verified: url.searchParams.get("unverified") !== "true",
        name: "Army provider",
        nonce: url.searchParams.get("nonce"),
      })
        .setProtectedHeader({ alg: "RS256", kid: "army" })
        .setIssuer(issuer(provider))
        .setAudience(audience(provider))
        .setSubject(z.string().parse(url.searchParams.get("subject")))
        .setIssuedAt(
          Number(url.searchParams.get("iat") ?? Math.floor(Date.now() / 1000))
        )
        .setExpirationTime(
          url.searchParams.get("expired") === "true" ? "-1h" : "5m"
        )
        .sign(privateKey);

      authorizations.set(code, {
        challenge: url.searchParams.get("challenge") ?? "",
        token,
      });
      callback.searchParams.set("code", code);
    }

    response.status(302).setHeader("location", callback.toString());
    response.end();
  })().catch(() =>
    response.status(400).json({ error: "Invalid synthetic provider request" })
  );
});

app.useGlobalFilters(new HttpErrors());

app.enableShutdownHooks();

await app.listen(config.PORT, config.API_HOST);
