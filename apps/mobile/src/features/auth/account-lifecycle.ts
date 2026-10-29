import { z } from "zod";

import { responseFailure } from "./errors";
import { apiOrigin, expoOrigin } from "./runtime";

const deletionReceiptSchema = z
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

export type DeletionReceipt = z.infer<typeof deletionReceiptSchema>;

export const requestDeletion = async (
  cookie: string,
  idempotencyKey: string
): Promise<DeletionReceipt> => {
  const abort = new AbortController();
  const deadline = setTimeout(() => abort.abort(), 10_000);

  try {
    const response = await fetch(`${apiOrigin}/api/account`, {
      body: JSON.stringify({ confirm: true }),
      credentials: "omit",
      headers: {
        "content-type": "application/json",
        cookie,
        "expo-origin": expoOrigin,
        "idempotency-key": z.uuid().parse(idempotencyKey),
      },
      method: "DELETE",
      signal: abort.signal,
    });

    if (response.status !== 202) {
      throw await responseFailure(response);
    }

    return deletionReceiptSchema.parse(await response.json());
  } finally {
    clearTimeout(deadline);
  }
};
