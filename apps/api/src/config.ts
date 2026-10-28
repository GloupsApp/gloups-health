import { z } from "zod";

export const API_CONFIG = Symbol("API_CONFIG");

export interface AppleConfiguration {
  readonly bundleId: string;
  readonly keyId: string;
  readonly privateKey: string;
  readonly serviceId: string;
  readonly teamId: string;
}

export interface TokenKeyring {
  readonly activeKid: string;
  readonly keys: Record<string, string>;
}

export interface ApiConfig {
  readonly apple: AppleConfiguration | null;
  readonly fingerprintSecret: string;
  readonly google: {
    readonly clientId: string;
    readonly clientSecret: string;
  } | null;
  readonly tokenKeyring: TokenKeyring;
  readonly baseURL: string;
  readonly cookiePrefix: string;
  readonly databaseURL: string;
  readonly emailSinkSecret: string;
  readonly emailSinkURL: string;
  readonly environment: "local";
  readonly host: string;
  readonly port: number;
  readonly secret: string;
  readonly trustedOrigins: string[];
}

const PLACEHOLDER = /replace|placeholder/iu;

const secretSchema = z
  .string()
  .min(32)
  .refine((value) => !PLACEHOLDER.test(value));

const originSchema = z
  .url()
  .transform((value) => new URL(value))
  .refine(
    (value) =>
      ["http:", "https:"].includes(value.protocol) &&
      value.pathname === "/" &&
      !value.search &&
      !value.hash &&
      !value.username &&
      !value.password
  )
  .transform((value) => value.origin);

export const localDatabaseURLSchema = z
  .url()
  .transform((value) => new URL(value))
  .refine(
    (value) =>
      ["postgres:", "postgresql:"].includes(value.protocol) &&
      value.hostname === "127.0.0.1" &&
      value.port === "25440" &&
      value.pathname === "/gloups_auth003"
  )
  .transform((value) => value.toString());

const trustedOriginSchema = z.url().refine((value) => {
  const parsed = new URL(value);

  return (
    !value.includes("*") &&
    ["http:", "https:", "gloups-health:", "exp:"].includes(parsed.protocol) &&
    !parsed.username &&
    !parsed.password &&
    !parsed.search &&
    !parsed.hash
  );
});

const sinkSchema = originSchema.refine((value) => {
  const parsed = new URL(value);

  return (
    parsed.protocol === "http:" &&
    parsed.hostname === "127.0.0.1" &&
    Boolean(parsed.port)
  );
});

const configSchema = z.object({
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1024).max(65_535).default(4340),
  APP_ENV: z.literal("local"),
  AUTH_TOKEN_VAULT_KEYRING: z.string().min(1),
  AUTH_TRUSTED_ORIGINS: z
    .string()
    .min(1)
    .transform((value) => value.split(",").map((origin) => origin.trim()))
    .pipe(z.array(trustedOriginSchema).min(1)),
  BETTER_AUTH_SECRET: secretSchema,
  BETTER_AUTH_URL: originSchema,
  DATABASE_URL: localDatabaseURLSchema,
  EMAIL_SINK_SECRET: secretSchema,
  EMAIL_SINK_URL: sinkSchema,
  IDENTITY_FINGERPRINT_SECRET: secretSchema,
});

const appleConfigurationSchema = z.object({
  APPLE_BUNDLE_ID: z.string().min(1),
  APPLE_KEY_ID: z.string().min(1),
  APPLE_PRIVATE_KEY: z.string().min(1),
  APPLE_SERVICE_ID: z.string().min(1),
  APPLE_TEAM_ID: z.string().min(1),
});

const googleConfigurationSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

const keyringSchema = z
  .object({
    activeKid: z.string().min(1),
    keys: z.record(z.string(), z.string().regex(/^[A-Za-z0-9_-]{43}$/u)),
  })
  .refine((value) => Object.hasOwn(value.keys, value.activeKid));

const providerConfiguration = (env: NodeJS.ProcessEnv, baseURL: string) => {
  let apple: AppleConfiguration | null = null;
  let google: ApiConfig["google"] = null;

  if (
    Object.keys(appleConfigurationSchema.shape).some((key) => Boolean(env[key]))
  ) {
    const value = appleConfigurationSchema.parse(env);
    apple = {
      bundleId: value.APPLE_BUNDLE_ID,
      keyId: value.APPLE_KEY_ID,
      privateKey: value.APPLE_PRIVATE_KEY.replaceAll("\\n", "\n"),
      serviceId: value.APPLE_SERVICE_ID,
      teamId: value.APPLE_TEAM_ID,
    };
  }

  if (env["GOOGLE_CLIENT_ID"] || env["GOOGLE_CLIENT_SECRET"]) {
    const value = googleConfigurationSchema.parse(env);
    google = {
      clientId: value.GOOGLE_CLIENT_ID,
      clientSecret: value.GOOGLE_CLIENT_SECRET,
    };
  }

  if ((apple || google) && !baseURL.startsWith("https://")) {
    throw new Error(
      "Social providers require the inventoried HTTPS callback environment."
    );
  }

  return { apple, google };
};

export const readConfig = (env: NodeJS.ProcessEnv = process.env): ApiConfig => {
  const result = configSchema.safeParse(env);

  if (!result.success) {
    throw new Error(
      "Invalid local API configuration. Release requires accepted provider, email and retention configuration."
    );
  }

  const value = result.data;
  let providers: ReturnType<typeof providerConfiguration>;
  let tokenKeyring: TokenKeyring;

  try {
    providers = providerConfiguration(env, value.BETTER_AUTH_URL);
    tokenKeyring = keyringSchema.parse(
      JSON.parse(value.AUTH_TOKEN_VAULT_KEYRING)
    );
  } catch {
    throw new Error("Invalid provider or credential-vault configuration.");
  }

  return {
    ...providers,
    baseURL: value.BETTER_AUTH_URL,
    cookiePrefix: "gloups-health-local",
    databaseURL: value.DATABASE_URL,
    emailSinkSecret: value.EMAIL_SINK_SECRET,
    emailSinkURL: value.EMAIL_SINK_URL,
    environment: value.APP_ENV,
    fingerprintSecret: value.IDENTITY_FINGERPRINT_SECRET,
    host: value.API_HOST,
    port: value.API_PORT,
    secret: value.BETTER_AUTH_SECRET,
    tokenKeyring,
    trustedOrigins: value.AUTH_TRUSTED_ORIGINS,
  };
};
