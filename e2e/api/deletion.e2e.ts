import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";

import { expect, test } from "e2e";
import { z } from "zod";

import {
  installAuthHooks,
  acceptedDeletion,
  cookies,
  deleteAccount,
  deletionReceiptSchema,
  deliveredLink,
  json,
  origin,
  ownedDeletions,
  post,
  rejectedVerification,
  responseStatus,
  runWorker,
  sink,
  sinkHeaders,
  sql,
  syntheticApple,
  verifiedIdentity,
} from "./helpers/auth-api.js";

installAuthHooks();

test(
  "DEL-01/03: deletion freezes two sessions, survives worker restart, and isolates re-registration proofs",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();

    const account = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
    );

    const second = await post(
      "/api/auth/sign-in/email",
      JSON.stringify(current.user)
    );

    expect(second.status).toBe(200);
    await post(
      "/api/auth/request-password-reset",
      JSON.stringify({
        email: current.user.email,
        redirectTo: "gloups-health:///reset-password",
      })
    );
    const reset = await deliveredLink(current.user.email, "reset-password");
    const oldResetToken = new URL(reset.url).pathname.split("/").at(-1);
    expect(
      await responseStatus(
        deleteAccount(current.cookie, randomUUID(), { confirm: false })
      )
    ).toBe(400);
    const receipt = await acceptedDeletion(current.cookie);
    expect(receipt.gloups).toBe("pending");
    expect(receipt.appleRevocation).toBe("not_applicable");

    const statuses = await Promise.all(
      [current.cookie, cookies(second)].map((cookie) =>
        responseStatus(fetch(`${origin}/api/me`, { headers: { cookie } }))
      )
    );

    expect(statuses).toEqual([401, 401]);
    expect(
      await responseStatus(deleteAccount(current.cookie, randomUUID()))
    ).toBe(401);
    expect(
      await responseStatus(fetch(`${origin}/api/account/${receipt.deletionId}`))
    ).toBe(404);
    expect(
      await responseStatus(
        post("/api/auth/sign-in/email", JSON.stringify(current.user))
      )
    ).toBe(403);
    // Simulate an interrupted worker lease in the real isolated database.
    sql(
      `update deletion_job set lease_id='${randomUUID()}',lease_until=now()+interval '1 minute' where id='${receipt.deletionId}'`
    );
    runWorker();
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("1");
    sql(
      `update deletion_job set lease_until=now()-interval '1 second' where id='${receipt.deletionId}'`
    );
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation || ':' || (auth_user_id is null)::text from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:not_applicable:true");
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("0");
    expect(
      sql(
        `select count(*) from gloups_account where id='${account.account.id}'`
      )
    ).toBe("0");
    expect(
      sql(
        'select count(*) from issued_verification where auth_user_id not in (select id from "user")'
      )
    ).toBe("0");

    const blocked = await post(
      "/api/auth/sign-up/email",
      JSON.stringify(current.user)
    );

    expect(blocked.status >= 400).toBe(true);
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("0");
    // Advance only this synthetic reservation beyond the explicit local security window.
    sql(
      `update identity_tombstone set expires_at=now()-interval '1 second' where deletion_id='${receipt.deletionId}'`
    );
    await fetch(`${sink}/messages`, { headers: sinkHeaders, method: "DELETE" });

    const replacement = {
      ...current.user,
      password: randomBytes(24).toString("base64url"),
    };

    expect(
      await responseStatus(
        post("/api/auth/sign-up/email", JSON.stringify(replacement))
      )
    ).toBe(200);
    const link = await deliveredLink(replacement.email, "verify-email");
    expect(await responseStatus(fetch(link.url, { redirect: "manual" }))).toBe(
      302
    );

    const signin = await post(
      "/api/auth/sign-in/email",
      JSON.stringify(replacement)
    );

    expect(signin.status).toBe(200);

    const next = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: cookies(signin) } })
    );

    expect(next.account.id !== account.account.id).toBe(true);
    rejectedVerification(await fetch(current.link.url, { redirect: "manual" }));
    expect(
      await responseStatus(
        post(
          "/api/auth/reset-password",
          JSON.stringify({
            newPassword: randomBytes(24).toString("base64url"),
            token: oldResetToken,
          })
        )
      )
    ).toBe(400);
  }
);

test(
  "DEL-01: concurrent same-key commands create one durable receipt",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    const key = randomUUID();

    const responses = await Promise.all(
      Array.from({ length: 8 }, () => deleteAccount(current.cookie, key))
    );

    expect(
      responses.every((response) => [202, 401].includes(response.status))
    ).toBe(true);
    const accepted = responses.filter((response) => response.status === 202);
    expect(accepted.length > 0).toBe(true);

    const receipts = await Promise.all(
      accepted.map(async (response) =>
        deletionReceiptSchema.parse(await response.json())
      )
    );

    const ids = new Set(receipts.map((receipt) => receipt.deletionId));
    expect(ids.size).toBe(1);
    const id = z.uuid().parse(receipts[0]?.deletionId);
    ownedDeletions.add(id);
    expect(
      sql(`select count(*) from deletion_job where idempotency_key='${key}'`)
    ).toBe("1");
    runWorker();
  }
);

test(
  "DEL-02: failed durable handoff rolls back freeze and revocation",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();

    const before = await json(
      await fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
    );

    sql(
      `create function auth003_fail_deletion() returns trigger language plpgsql as $$ begin if new.account_id='${before.account.id}' then raise exception 'Controlled synthetic handoff failure'; end if; return new; end $$; create trigger auth003_fail_deletion before insert on deletion_job for each row execute function auth003_fail_deletion();`
    );

    try {
      expect(
        await responseStatus(deleteAccount(current.cookie, randomUUID()))
      ).toBe(503);
      expect(
        await responseStatus(
          fetch(`${origin}/api/me`, { headers: { cookie: current.cookie } })
        )
      ).toBe(200);
      expect(
        sql(
          `select deletion_id is null from gloups_account where id='${before.account.id}'`
        )
      ).toBe("t");
      expect(
        sql(
          `select count(*) from deletion_job where account_id='${before.account.id}'`
        )
      ).toBe("0");
    } finally {
      sql(
        "drop trigger auth003_fail_deletion on deletion_job; drop function auth003_fail_deletion();"
      );
    }
  }
);

test(
  "DEL-02: missing Apple material completes Gloups erasure with explicit manual guidance",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    syntheticApple(current.user.email, false);
    const receipt = await acceptedDeletion(current.cookie);
    expect(receipt.appleRevocation).toBe("manual_required");
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:manual_required");
    expect(
      sql(`select count(*) from "user" where email='${current.user.email}'`)
    ).toBe("0");
  }
);

test(
  "DEL-02: unavailable revocation retains only retry material, then applies the local fallback",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    // Deliberately unusable synthetic material exercises failure, never provider success.
    syntheticApple(current.user.email, true);
    const receipt = await acceptedDeletion(current.cookie);
    expect(receipt.appleRevocation).toBe("pending");
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation || ':' || (auth_user_id is null)::text || ':' || attempts::text from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:pending:true:1");
    expect(
      sql(
        `select count(*) from provider_credential where id in (select jsonb_array_elements_text(credential_refs) from deletion_job where id='${receipt.deletionId}') and auth_user_id is null and expected_actor_id is null and apple_subject='' and ciphertext is not null`
      )
    ).toBe("1");
    sql(
      `update deletion_job set created_at=now()-interval '2 days',retry_at=now()-interval '1 second' where id='${receipt.deletionId}'`
    );
    runWorker();
    expect(
      sql(
        `select gloups || ':' || apple_revocation || ':' || jsonb_array_length(credential_refs)::text from deletion_job where id='${receipt.deletionId}'`
      )
    ).toBe("deleted:manual_required:0");
  }
);

test(
  "DEL-01/MAIL-04: reset and sixteen deletion admissions preserve unrelated account progress beyond the main pool capacity",
  { platforms: ["api"], timeout: 30_000 },
  async () => {
    const current = await verifiedIdentity();
    const other = await verifiedIdentity();

    const userId = sql(
      `select id from "user" where email='${current.user.email}'`
    );

    expect(
      await responseStatus(
        post(
          "/api/auth/request-password-reset",
          JSON.stringify({
            email: current.user.email,
            redirectTo: "gloups-health:///reset-password",
          })
        )
      )
    ).toBe(200);
    const delivered = await deliveredLink(current.user.email, "reset-password");
    const redirected = await fetch(delivered.url, { redirect: "manual" });

    const token = new URL(
      redirected.headers.get("location") ?? ""
    ).searchParams.get("token");

    expect(Boolean(token)).toBe(true);
    sql(
      `create function auth003_pause_reset() returns trigger language plpgsql as $$ begin if new.user_id='${userId}' and new.provider_id='credential' and new.password is distinct from old.password then perform pg_sleep(3); end if; return new; end $$; create trigger auth003_pause_reset before update on account for each row execute function auth003_pause_reset();`
    );
    const commands: Promise<Response>[] = [];

    try {
      const resetting = post(
        "/api/auth/reset-password",
        JSON.stringify({
          newPassword: randomBytes(24).toString("base64url"),
          token,
        })
      );

      commands.push(resetting);
      await expect
        .poll(
          () =>
            sql(
              "select count(*) from pg_stat_activity where application_name='gloups-auth003-main' and wait_event='PgSleep'"
            ),
          { timeout: 5000 }
        )
        .toBe("1");
      const key = randomUUID();

      const deleting = Array.from({ length: 16 }, () =>
        fetch(`${origin}/api/account`, {
          body: JSON.stringify({ confirm: true }),
          headers: {
            "content-type": "application/json",
            cookie: current.cookie,
            "idempotency-key": key,
            origin,
          },
          method: "DELETE",
          signal: AbortSignal.timeout(15_000),
        })
      );

      commands.push(...deleting);
      await expect
        .poll(
          () =>
            sql(
              "select count(*) from pg_stat_activity where application_name='gloups-auth003-proof' and wait_event_type='Lock'"
            ),
          { timeout: 2000 }
        )
        .toBe("1");

      const progress = await fetch(`${origin}/api/me`, {
        headers: { cookie: other.cookie },
        signal: AbortSignal.timeout(1500),
      });

      expect(progress.status).toBe(200);
      expect(
        sql(
          "select count(*) from pg_stat_activity where application_name='gloups-auth003-main' and wait_event_type='Lock' and query like '%pg_advisory_xact_lock%'"
        )
      ).toBe("0");
      const resetResponse = await resetting;
      expect(resetResponse.status).toBe(200);
      const results = await Promise.all(deleting);
      expect(
        results.every((response) => [202, 401].includes(response.status))
      ).toBe(true);
      const accepted = results.filter((response) => response.status === 202);
      expect(accepted.length > 0).toBe(true);

      const receipts = await Promise.all(
        accepted.map(async (response) =>
          deletionReceiptSchema.parse(await response.json())
        )
      );

      expect(new Set(receipts.map((receipt) => receipt.deletionId)).size).toBe(
        1
      );
      const id = z.uuid().parse(receipts[0]?.deletionId);
      ownedDeletions.add(id);
      runWorker();
    } finally {
      await Promise.allSettled(commands);
      sql(
        "drop trigger auth003_pause_reset on account; drop function auth003_pause_reset();"
      );
    }
  }
);

test(
  "DEL-02: failed orphan revocation persists backoff, removes tagged sessions, runs expiry cleanup and expires at the local bound",
  { platforms: ["api"] },
  async () => {
    const current = await verifiedIdentity();
    const id = randomUUID();
    const challengeId = randomUUID();
    const marker = randomUUID();
    const expiredProof = randomUUID();
    sql(
      `insert into provider_credential(id,apple_subject,ciphertext,client_id,created_at,phase,retry_at) values('${id}','orphan-${id}','synthetic-unreadable-credential','app.gloups.health',now(),'prepared',now()-interval '1 second'); update session set native_setup_id='${id}' where user_id=(select id from "user" where email='${current.user.email}'); insert into apple_challenge(id,nonce_hash,purpose,expires_at) values('${challengeId}','synthetic','sign-in',now()-interval '1 second'); insert into apple_notification(id,processed_at) values('${marker}',now()-interval '3 days'); insert into verification(id,identifier,value,expires_at) values('${expiredProof}','auth003-expired','synthetic',now()-interval '1 second');`
    );

    try {
      runWorker();
      expect(
        sql(
          `select phase || ':' || attempts::text || ':' || (retry_at > now())::text from provider_credential where id='${id}'`
        )
      ).toBe("reconcile:1:true");
      expect(
        sql(`select count(*) from session where native_setup_id='${id}'`)
      ).toBe("0");
      expect(
        sql(
          `select (select count(*) from apple_challenge where id='${challengeId}') + (select count(*) from apple_notification where id='${marker}') + (select count(*) from verification where id='${expiredProof}')`
        )
      ).toBe("0");
      // A future schedule prevents an immediate retry even after a worker restart.
      sql(
        `update provider_credential set retry_at=now()+interval '1 hour' where id='${id}'`
      );
      runWorker();
      expect(
        sql(`select attempts from provider_credential where id='${id}'`)
      ).toBe("1");
      sql(
        `update provider_credential set created_at=now()-interval '2 days',retry_at=now()-interval '1 second' where id='${id}'`
      );
      runWorker();
      expect(
        sql(`select count(*) from provider_credential where id='${id}'`)
      ).toBe("0");
    } finally {
      sql(
        `delete from provider_credential where id='${id}'; delete from apple_challenge where id='${challengeId}'; delete from apple_notification where id='${marker}'; delete from verification where id='${expiredProof}';`
      );
    }
  }
);

test(
  "DEL-04: Nest worker drains its current durable handoff before signal-driven database shutdown",
  { platforms: ["api"], timeout: 20_000 },
  async () => {
    const current = await verifiedIdentity();

    const userId = sql(
      `select id from "user" where email='${current.user.email}'`
    );

    const receipt = await acceptedDeletion(current.cookie);
    sql(
      `create function auth003_pause_worker() returns trigger language plpgsql as $$ begin if old.id='${userId}' then perform pg_sleep(1.5); end if; return old; end $$; create trigger auth003_pause_worker before delete on "user" for each row execute function auth003_pause_worker();`
    );

    const worker = spawn(
      "node",
      ["--env-file=.env.local", "dist/deletion-worker.js"],
      { cwd: "apps/api", stdio: "ignore" }
    );

    try {
      await expect
        .poll(
          () =>
            Number(
              sql(
                "select count(*) from pg_stat_activity where application_name='gloups-auth003-main' and wait_event='PgSleep'"
              )
            ) > 0,
          { timeout: 5000 }
        )
        .toBe(true);
      expect(worker.kill("SIGTERM")).toBe(true);
      await expect
        .poll(() => worker.exitCode !== null || worker.signalCode !== null, {
          timeout: 5000,
        })
        .toBe(true);
      expect(worker.exitCode === 0 || worker.signalCode === "SIGTERM").toBe(
        true
      );
      expect(
        sql(
          `select gloups || ':' || apple_revocation || ':' || (completed_at is not null)::text from deletion_job where id='${receipt.deletionId}'`
        )
      ).toBe("deleted:not_applicable:true");
      expect(sql(`select count(*) from "user" where id='${userId}'`)).toBe("0");
    } finally {
      if (worker.exitCode === null && worker.signalCode === null) {
        worker.kill("SIGKILL");
      }

      sql(
        'drop trigger auth003_pause_worker on "user"; drop function auth003_pause_worker();'
      );
    }
  }
);
