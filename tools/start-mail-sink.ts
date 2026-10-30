import { createMailSink } from "./mail-sink.ts";

process.loadEnvFile("apps/api/.env.local");

if (process.env["NODE_ENV"] === "production") {
  throw new Error("The synthetic mail sink cannot run in production");
}

const token = process.env["EMAIL_DELIVERY_TOKEN"];

if (!token) {
  throw new Error("EMAIL_DELIVERY_TOKEN is required");
}

const sink = await createMailSink(token, 4346);

process.stdout.write(
  "Synthetic email sink listening on 4346 (example.test only)\n"
);

process.once("SIGTERM", () => {
  void sink.close();
});

process.once("SIGINT", () => {
  void sink.close();
});
