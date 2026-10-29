import { loadEnvFile } from "node:process";

import { z } from "zod";

if (process.env["GLOUPS_AUTH003_FAULTS"] === "1") {
  loadEnvFile(
    ".superpowers/sdd/2026-10-28-authentication-implementation/relay.env.local"
  );
}

interface RelayCommand {
  mode: "forward" | "hold-next" | "release" | "cut";
  path?: "/api/me" | "/api/auth/sign-in/email";
}

const statusSchema = z.object({
  heldCount: z.number().int(),
  waiting: z.boolean(),
});

const relayRequest = async (command?: RelayCommand) => {
  const secret = z
    .string()
    .min(32)
    .parse(process.env["GLOUPS_AUTH003_RELAY_SECRET"]);

  const options: RequestInit = {
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    method: command ? "POST" : "GET",
    signal: AbortSignal.timeout(5000),
  };

  if (command) {
    options.body = JSON.stringify(command);
  }

  const response = await fetch("http://127.0.0.1:4342/_army/control", options);

  if (!response.ok) {
    throw new Error("The owned local fault relay is unavailable.");
  }

  return statusSchema.parse(await response.json());
};

export const controlRelay = (command: RelayCommand) => relayRequest(command);
export const relayStatus = () => relayRequest();
