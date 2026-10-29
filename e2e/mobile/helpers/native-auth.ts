import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";
import { loadEnvFile } from "node:process";

import { z } from "zod";

loadEnvFile("apps/api/.env.local");

const origin = "http://127.0.0.1:4340";
const sink = "http://127.0.0.1:4341";
const database = new URL(process.env["DATABASE_URL"] ?? "");

if (
  process.env["APP_ENV"] !== "local" ||
  database.hostname !== "127.0.0.1" ||
  database.port !== "25440" ||
  database.pathname !== "/gloups_auth003"
) {
  throw new Error("Native E2E requires the isolated AUTH-003 database.");
}

const sinkHeaders = {
  authorization: `Bearer ${process.env["EMAIL_SINK_SECRET"] ?? ""}`,
  "content-type": "application/json",
};

const inboxSchema = z.object({
  messages: z.array(
    z.object({
      message: z.object({
        kind: z.enum(["verify-email", "reset-password"]),
        language: z.enum(["en", "fr"]),
        recipient: z.email(),
        url: z.url(),
      }),
    })
  ),
});

const ownedEmails = new Set<string>();

export const syntheticEmail = (): string => {
  const email = `auth003-${randomUUID()}@example.test`;
  ownedEmails.add(email);

  return email;
};

export const localSQL = (statement: string): string =>
  execFileSync(
    "docker",
    [
      "compose",
      "-p",
      "gloups-auth-auth003",
      "--env-file",
      "apps/api/.env.local",
      "-f",
      "apps/api/compose.local.yaml",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "gloups_auth003",
      "-d",
      "gloups_auth003",
      "-qAt",
      "-c",
      statement,
    ],
    { encoding: "utf-8", timeout: 10_000 }
  ).trim();

export const cleanupLocalIdentities = (): void => {
  for (const email of ownedEmails) {
    if (!/^auth003-[0-9a-f-]{36}@example\.test$/u.test(email)) {
      throw new Error("Fixture cleanup refuses an unowned identity.");
    }

    const identity = `(select id from "user" where email='${email}')`;
    const jobs = `(select deletion_id from gloups_account where auth_user_id in ${identity})`;
    localSQL(`begin;
      delete from identity_tombstone where deletion_id in ${jobs};
      delete from deletion_job where id in ${jobs};
      delete from verification where value in ${identity};
      delete from gloups_account where auth_user_id in ${identity};
      delete from "user" where email='${email}';
      commit;`);
  }

  ownedEmails.clear();
};

export const resetLocalBudgets = async (): Promise<void> => {
  localSQL("truncate table rate_limit, http_rate_limit");
  await fetch(`${sink}/control`, {
    body: JSON.stringify({ reject: false }),
    headers: sinkHeaders,
    method: "POST",
  });
  await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });
};

interface CredentialRequest {
  email: string;
  password: string;
  callbackURL?: string;
  name?: string;
  preferredLanguage?: "en" | "fr";
}

const fixturePassword = (): string =>
  z.string().min(15).max(128).parse(process.env["GLOUPS_AUTH003_E2E_PASSWORD"]);

export const authPost = (route: string, body: CredentialRequest, cookie = "") =>
  fetch(`${origin}/api/auth/${route}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", cookie, origin },
    method: "POST",
    redirect: "manual",
  });

export const emailReceipt = async (
  email: string,
  kind: "verify-email" | "reset-password"
) => {
  const response = await fetch(`${sink}/messages`, { headers: sinkHeaders });
  const inbox = inboxSchema.parse(await response.json());

  const receipt = inbox.messages.findLast(
    (entry) => entry.message.recipient === email && entry.message.kind === kind
  );

  if (!receipt) {
    throw new Error("Synthetic email has not arrived.");
  }

  return receipt.message;
};

export const consumeEmailLink = async (
  email: string,
  kind: "verify-email" | "reset-password"
): Promise<string> => {
  const receipt = await emailReceipt(email, kind);
  const response = await fetch(receipt.url, { redirect: "manual" });

  if (response.status !== 302) {
    throw new Error("Synthetic email link did not redirect.");
  }

  return z.url().parse(response.headers.get("location"));
};

export const verifiedFixture = async () => {
  const email = syntheticEmail();

  const signup = await authPost("sign-up/email", {
    callbackURL: "gloups-health://auth/callback?flow=verification",
    email,
    name: "",
    password: fixturePassword(),
    preferredLanguage: "en",
  });

  if (signup.status !== 200) {
    throw new Error("Synthetic signup failed.");
  }

  await consumeEmailLink(email, "verify-email");

  const response = await authPost("sign-in/email", {
    email,
    password: fixturePassword(),
  });

  if (!response.ok) {
    throw new Error("Synthetic sign-in failed.");
  }

  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

  const me = await fetch(`${origin}/api/me`, { headers: { cookie } });

  const view = z
    .object({ account: z.object({ id: z.uuid() }) })
    .parse(await me.json());

  return { accountId: view.account.id, cookie, email };
};

export const protectedStatus = async (cookie: string): Promise<number> => {
  const response = await fetch(`${origin}/api/me`, { headers: { cookie } });

  return response.status;
};

export const assignedIOSDevice = (): string => {
  const device =
    process.env["GLOUPS_AUTH003_IOS_UDID"] ??
    "C2C9EC33-9411-4AD5-986D-277CC6BE0383";

  if (
    ![
      "C2C9EC33-9411-4AD5-986D-277CC6BE0383",
      "EF701CA4-D508-4018-914B-72E41E855128",
    ].includes(device)
  ) {
    throw new Error("Native E2E device is outside this lane.");
  }

  return device;
};

// One-time proofs stay in memory; runner URL arguments and errors never receive them.
export const deliverPrivateLink = (platform: string, link: string): void => {
  const url = new URL(link);

  if (url.protocol !== "gloups-health:") {
    throw new Error("Private link must target the local Gloups build.");
  }

  try {
    if (platform === "ios") {
      execFileSync(
        "xcrun",
        ["simctl", "openurl", assignedIOSDevice(), url.toString()],
        { stdio: "ignore", timeout: 15_000 }
      );
    } else {
      const quoted = `'${url.toString().replaceAll("'", "'\\''")}'`;

      const sdkDirectory =
        process.env["ANDROID_HOME"] ??
        process.env["ANDROID_SDK_ROOT"] ??
        path.join(homedir(), "Library", "Android", "sdk");

      execFileSync(
        path.join(sdkDirectory, "platform-tools", "adb"),
        [
          "-s",
          "emulator-5614",
          "shell",
          `am start -W -a android.intent.action.VIEW -d ${quoted} app.gloups.health`,
        ],
        { stdio: "ignore", timeout: 15_000 }
      );
    }
  } catch {
    throw new Error(
      "Could not deliver the synthetic one-time link on the assigned device."
    );
  }
};
