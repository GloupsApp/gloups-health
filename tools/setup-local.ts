import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

const password = randomBytes(24).toString("hex");

const env = {
  API_HOST: "0.0.0.0",
  API_URL: "http://127.0.0.1:4345",
  AUTH_SECRET: randomBytes(32).toString("hex"),
  DATABASE_URL: `postgresql://gloups:${password}@127.0.0.1:25445/gloups_glo5`,
  EMAIL_DELIVERY_TOKEN: randomBytes(32).toString("hex"),
  EMAIL_DELIVERY_URL: "http://127.0.0.1:4346/messages",
  NODE_ENV: "development",
  PORT: "4345",
  POSTGRES_PASSWORD: password,
};

await writeFile(
  "apps/api/.env.local",
  `${Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`,
  { flag: "wx", mode: 0o600 }
);

await writeFile(
  "apps/mobile/.env.local",
  "EXPO_PUBLIC_API_URL=http://127.0.0.1:4345\n",
  { flag: "wx", mode: 0o600 }
);

process.stdout.write(
  "Created local configuration. Secrets were written only to ignored files.\n"
);
