import { z } from "zod";

const environmentSchema = z.object({
  API_HOST: z.string().default("127.0.0.1"),
  API_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.url().refine((value) => /^postgres(?:ql)?:/u.test(value)),
  EMAIL_DELIVERY_TOKEN: z.string().min(32),
  EMAIL_DELIVERY_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4345),
});

export const readConfig = (environment: NodeJS.ProcessEnv) => {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`
    );
  }

  const config = result.data;
  const api = new URL(config.API_URL);
  const delivery = new URL(config.EMAIL_DELIVERY_URL);

  if (
    api.pathname !== "/" ||
    api.search ||
    api.hash ||
    api.username ||
    api.password
  ) {
    throw new Error("API_URL must be an origin");
  }

  if (
    config.NODE_ENV === "production" &&
    (api.protocol !== "https:" || delivery.protocol !== "https:")
  ) {
    throw new Error("Production API and email delivery require HTTPS");
  }

  return config;
};

export type ApiConfig = ReturnType<typeof readConfig>;
