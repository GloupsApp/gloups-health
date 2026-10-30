import { execFile, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

import { createMailSink } from "../../tools/mail-sink.ts";

export const execute = promisify(execFile);

export const POSTGRES_IMAGE =
  "postgres:18.6-bookworm@sha256:5c4783a8cc3f0074912164f94dfa1be4e043438f0f707cf968d7af9a0d31a2c8";

export const waitFor = async (
  condition: () => Promise<boolean>,
  timeout = 30_000
) => {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      if (await condition()) {
        return;
      }
    } catch {
      // The process or database may still be starting.
    }

    await delay(100);
  }

  throw new Error("Service did not become ready within the timeout");
};

const freePort = async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Narrow Node's TCP address union.
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }

  await promisify(server.close.bind(server))();

  return address.port;
};

export const startHarness = async () => {
  const name = `gloups-glo5-integration-${randomUUID()}`;
  const password = randomBytes(24).toString("hex");
  const databasePort = await freePort();
  const token = randomBytes(32).toString("hex");
  const sink = await createMailSink(token);
  let child: ReturnType<typeof spawn> | null = null;
  let diagnostics = "";

  const stopApi = async () => {
    if (!child) {
      return;
    }

    const processToStop = child;
    child = null;
    const exited = once(processToStop, "exit");
    const timeout = new AbortController();
    processToStop.kill("SIGTERM");
    let result;

    try {
      result = await Promise.race([
        exited,
        delay(5000, undefined, { signal: timeout.signal }).then(() => {
          processToStop.kill("SIGKILL");
          throw new Error("API failed to shut down cleanly");
        }),
      ]);
    } finally {
      timeout.abort();
    }

    if (result[0] !== 0 && result[1] !== "SIGTERM") {
      throw new Error("API exited unexpectedly");
    }
  };

  const close = async () => {
    try {
      await stopApi();
    } finally {
      await sink.close();
      await execute("docker", ["rm", "--force", "--volumes", name]);
    }
  };

  try {
    await execute("docker", [
      "run",
      "--detach",
      "--name",
      name,
      "--publish",
      `127.0.0.1:${databasePort}:5432`,
      "--env",
      `POSTGRES_PASSWORD=${password}`,
      "--env",
      "POSTGRES_USER=gloups",
      "--env",
      "POSTGRES_DB=gloups_glo5",
      POSTGRES_IMAGE,
    ]);

    const sql = async (query: string) =>
      (
        await execute("docker", [
          "exec",
          name,
          "psql",
          "-U",
          "gloups",
          "-d",
          "gloups_glo5",
          "-Atc",
          query,
        ])
      ).stdout.trim();

    await waitFor(async () => (await sql("SELECT 1")) === "1");

    const published = (
      await execute("docker", ["port", name, "5432/tcp"])
    ).stdout.trim();

    const dbPort = published.split(":").at(-1);
    const port = await freePort();
    const url = `http://127.0.0.1:${port}`;

    const environment = {
      ...process.env,
      API_HOST: "127.0.0.1",
      API_URL: url,
      AUTH_SECRET: randomBytes(32).toString("hex"),
      DATABASE_URL: `postgresql://gloups:${password}@127.0.0.1:${dbPort}/gloups_glo5`,
      EMAIL_DELIVERY_TOKEN: token,
      EMAIL_DELIVERY_URL: sink.url,
      NODE_ENV: "test",
      PORT: String(port),
    };

    await execute(process.execPath, ["apps/api/dist/migrate.js"], {
      env: environment,
    });

    const startApi = async () => {
      child = spawn(process.execPath, ["apps/api/dist/main.js"], {
        env: environment,
        stdio: "pipe",
      });
      child.stdout?.resume();
      child.stderr?.on("data", (chunk: Buffer) => {
        diagnostics += chunk.toString();
      });
      await waitFor(async () => (await fetch(`${url}/healthz`)).ok);
    };

    await startApi();

    return {
      close,
      diagnostics: () => diagnostics,
      restartApi: async () => {
        await stopApi();
        await startApi();
      },
      restartDatabase: async () => {
        await execute("docker", ["restart", name]);
        await waitFor(async () => (await sql("SELECT 1")) === "1");
        await waitFor(async () => (await fetch(`${url}/healthz`)).ok);
      },
      sink,
      sql,
      url,
    };
  } catch (error) {
    await close();
    throw error;
  }
};
