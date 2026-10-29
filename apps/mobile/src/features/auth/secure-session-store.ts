import * as SecureStore from "expo-secure-store";
import { z } from "zod";

import { AuthFailureError } from "./errors";
import { storagePrefix } from "./runtime";

const indexKey = `${storagePrefix}_owned-keys`;
const retiredKey = `${storagePrefix}_retired`;

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  keychainService: "app.gloups.health.auth.local",
};

const keySchema = z.string().startsWith(`${storagePrefix}_`);
const indexSchema = z.array(keySchema);

export const createSessionStorage = async () => {
  const serialized = await SecureStore.getItemAsync(indexKey, secureOptions);

  const keys = new Set(
    serialized ? indexSchema.parse(JSON.parse(serialized)) : []
  );

  let active = true;
  let retirement: Promise<void> | null = null;
  let pending = Promise.resolve();

  const clear = async () => {
    await Promise.all(
      [...keys].map((key) => SecureStore.deleteItemAsync(key, secureOptions))
    );
    await SecureStore.deleteItemAsync(indexKey, secureOptions);
    await SecureStore.deleteItemAsync(retiredKey, secureOptions);
    keys.clear();
  };

  if (await SecureStore.getItemAsync(retiredKey, secureOptions)) {
    await clear();
  }

  const enqueue = (work: () => Promise<void>): Promise<void> => {
    const operation = pending.then(work);
    pending = operation.catch(() => {
      /* Retirement still waits for a failed write. */
    });

    return operation;
  };

  const storage = {
    getItem(name: string): string | null {
      return active
        ? SecureStore.getItem(keySchema.parse(name), secureOptions)
        : null;
    },
    async getItemAsync(name: string): Promise<string | null> {
      if (!active) {
        return null;
      }

      const value = await SecureStore.getItemAsync(
        keySchema.parse(name),
        secureOptions
      );

      return active ? value : null;
    },
    setItem(name: string, value: string): void {
      if (!active) {
        return;
      }

      keys.add(keySchema.parse(name));
      SecureStore.setItem(indexKey, JSON.stringify([...keys]), secureOptions);
      SecureStore.setItem(name, value, secureOptions);
    },
    setItemAsync(name: string, value: string): Promise<void> {
      if (!active) {
        return Promise.resolve();
      }

      keySchema.parse(name);

      return enqueue(async () => {
        if (!active) {
          return;
        }

        keys.add(name);
        await SecureStore.setItemAsync(
          indexKey,
          JSON.stringify([...keys]),
          secureOptions
        );

        if (active) {
          await SecureStore.setItemAsync(name, value, secureOptions);
        }
      });
    },
  };

  return {
    assertActive() {
      if (!active) {
        throw new AuthFailureError("stale");
      }
    },
    isActive: () => active,
    retire(): Promise<void> {
      retirement ??= (async () => {
        active = false;
        SecureStore.setItem(retiredKey, "1", secureOptions);
        await pending;
        await clear();
      })();

      return retirement;
    },
    storage,
  };
};

export type SessionStorage = Awaited<ReturnType<typeof createSessionStorage>>;
