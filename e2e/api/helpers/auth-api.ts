import { execFileSync } from "node:child_process";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";

import { afterEach, beforeAll, beforeEach, expect } from "e2e";
import { z } from "zod";

loadEnvFile("apps/api/.env.local");

export const origin = "http://127.0.0.1:4340";

export const sink = "http://127.0.0.1:4341";

const database = new URL(process.env["DATABASE_URL"] ?? "");

if (
  process.env["APP_ENV"] !== "local" ||
  database.hostname !== "127.0.0.1" ||
  database.port !== "25440" ||
  database.pathname !== "/gloups_auth003"
) {
  throw new Error("E2E requires the isolated AUTH-003 synthetic database.");
}

export const sinkHeaders = {
  authorization: `Bearer ${process.env["EMAIL_SINK_SECRET"] ?? ""}`,
  "content-type": "application/json",
};

export const sql = (statement: string): string =>
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

const accountViewSchema = z
  .object({
    account: z.object({ id: z.uuid() }).strict(),
    user: z
      .object({
        email: z.email(),
        emailVerified: z.boolean(),
        name: z.string(),
      })
      .strict(),
  })
  .strict();

const inboxSchema = z.object({
  messages: z.array(
    z.object({
      message: z.object({
        kind: z.enum(["verify-email", "reset-password"]),
        language: z.enum(["en", "fr"]),
        recipient: z.email(),
        subject: z.string(),
        url: z.url(),
      }),
      receiptId: z.uuid(),
    })
  ),
});

export const json = async (response: Response) =>
  accountViewSchema.parse(await response.json());

export const responseStatus = async (
  pending: Promise<Response>
): Promise<number> => {
  const response = await pending;

  return response.status;
};

export const post = (
  routePath: string,
  body: string,
  cookie = ""
): Promise<Response> => {
  const headers = new Headers({ "content-type": "application/json", origin });

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return fetch(`${origin}${routePath}`, {
    body,
    headers,
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
};

export const rejectedVerification = (response: Response): void => {
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(
    "gloups-health:///auth/callback?flow=verification&error=INVALID_TOKEN"
  );
  expect(response.headers.getSetCookie().length).toBe(0);
};

export const identity = (language: "en" | "fr" = "en", name = "") => ({
  callbackURL: "gloups-health:///auth/callback?flow=verification",
  email: `auth003-${randomUUID()}@example.test`,
  name,
  password: randomBytes(24).toString("base64url"),
  preferredLanguage: language,
});

export const deliveredLink = async (
  email: string,
  kind: "verify-email" | "reset-password"
) => {
  const response = await fetch(`${sink}/messages`, { headers: sinkHeaders });
  const inbox = inboxSchema.parse(await response.json());

  const found = inbox.messages.find(
    (entry) => entry.message.recipient === email && entry.message.kind === kind
  );

  if (!found) {
    throw new Error("No matching synthetic email receipt.");
  }

  return {
    language: found.message.language,
    subject: found.message.subject,
    url: found.message.url,
  };
};

export const cookies = (response: Response): string =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

export const verifiedIdentity = async (
  language: "en" | "fr" = "en",
  name = ""
) => {
  const user = identity(language, name);
  const signup = await post("/api/auth/sign-up/email", JSON.stringify(user));
  expect(signup.status).toBe(200);
  expect(signup.headers.getSetCookie().length).toBe(0);
  const link = await deliveredLink(user.email, "verify-email");
  const verification = await fetch(link.url, { redirect: "manual" });
  expect(verification.status).toBe(302);

  const signin = await post(
    "/api/auth/sign-in/email",
    JSON.stringify({
      email: user.email,
      password: user.password,
    })
  );

  expect(signin.status).toBe(200);
  const cookie = cookies(signin);
  expect(Boolean(cookie)).toBe(true);

  return { cookie, link, signin, user };
};

export const deletionReceiptSchema = z
  .object({
    appleRevocation: z.enum([
      "pending",
      "complete",
      "manual_required",
      "not_applicable",
    ]),
    deletionId: z.uuid(),
    gloups: z.enum(["pending", "deleted"]),
  })
  .strict();

export const ownedDeletions = new Set<string>();

export const deleteAccount = (
  cookie: string,
  key: string,
  body?: { confirm: boolean }
) =>
  fetch(`${origin}/api/account`, {
    body: JSON.stringify(body ?? { confirm: true }),
    headers: {
      "content-type": "application/json",
      cookie,
      "idempotency-key": key,
      origin,
    },
    method: "DELETE",
  });

export const runWorker = () =>
  execFileSync(
    "node",
    ["--env-file=.env.local", "dist/deletion-worker.js", "--once"],
    { cwd: "apps/api", encoding: "utf-8", timeout: 15_000 }
  );

export const acceptedDeletion = async (cookie: string, key = randomUUID()) => {
  const response = await deleteAccount(cookie, key);
  expect(response.status).toBe(202);
  const receipt = deletionReceiptSchema.parse(await response.json());
  ownedDeletions.add(receipt.deletionId);
  expect(
    response.headers.getSetCookie().some((value) => /max-age=0/iu.test(value))
  ).toBe(true);

  return receipt;
};

const syntheticFingerprint = (kind: "identity" | "subject", value: string) =>
  createHmac("sha256", process.env["IDENTITY_FINGERPRINT_SECRET"] ?? "")
    .update(`${kind}:${value}`)
    .digest("hex");

export const syntheticApple = (email: string, credential: boolean) => {
  const userId = sql(`select id from "user" where email='${email}'`);
  const subject = `auth003-sub-${randomUUID()}`;

  sql(
    `insert into account(id,account_id,provider_id,user_id,created_at,updated_at,identity_fingerprint,subject_fingerprint) values ('${randomUUID()}','${subject}','apple','${userId}',now(),now(),'${syntheticFingerprint("identity", userId)}','${syntheticFingerprint("subject", `apple:${subject}`)}')`
  );

  if (credential) {
    sql(
      `insert into provider_credential(id,apple_subject,auth_user_id,ciphertext,client_id,created_at,phase,retry_at) values('${randomUUID()}','${subject}','${userId}','synthetic-unreadable-credential','app.gloups.health',now(),'bound',now())`
    );
  }
};

export const installAuthHooks = (): void => {
  beforeAll(async () => {
    await expect
      .poll(async () => {
        try {
          const response = await fetch(`${origin}/healthz`);

          return response.status;
        } catch {
          return 0;
        }
      })
      .toBe(200);
  });

  beforeEach(async () => {
    sql("truncate table rate_limit, http_rate_limit");
    await fetch(`${sink}/control`, {
      body: JSON.stringify({ reject: false }),
      headers: sinkHeaders,
      method: "POST",
    });
    await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });
  });

  afterEach(async () => {
    await fetch(`${sink}/control`, {
      body: JSON.stringify({ reject: false }),
      headers: sinkHeaders,
      method: "POST",
    });
    await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });

    for (const id of ownedDeletions) {
      sql(
        `begin; delete from provider_credential where id in (select jsonb_array_elements_text(credential_refs) from deletion_job where id='${id}'); delete from identity_tombstone where deletion_id='${id}'; delete from deletion_job where id='${id}'; commit;`
      );
    }

    ownedDeletions.clear();
    sql(
      "begin; delete from verification where value in (select id from \"user\" where email like 'auth003-%@example.test'); delete from gloups_account where auth_user_id in (select id from \"user\" where email like 'auth003-%@example.test'); delete from \"user\" where email like 'auth003-%@example.test'; commit;"
    );
  });
};
