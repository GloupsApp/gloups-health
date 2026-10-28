import { z } from "zod";

export interface ApiConfig {
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
    ["http:", "https:", "gloups-health:"].includes(parsed.protocol) &&
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
});

export const readConfig = (env: NodeJS.ProcessEnv = process.env): ApiConfig => {
  const result = configSchema.safeParse(env);

  if (!result.success) {
    throw new Error(
      "Invalid local API configuration. Release requires accepted provider, email and retention configuration."
    );
  }

  const value = result.data;

  return {
    baseURL: value.BETTER_AUTH_URL,
    cookiePrefix: "gloups-health-local",
    databaseURL: value.DATABASE_URL,
    emailSinkSecret: value.EMAIL_SINK_SECRET,
    emailSinkURL: value.EMAIL_SINK_URL,
    environment: value.APP_ENV,
    host: value.API_HOST,
    port: value.API_PORT,
    secret: value.BETTER_AUTH_SECRET,
    trustedOrigins: value.AUTH_TRUSTED_ORIGINS,
  };
};
