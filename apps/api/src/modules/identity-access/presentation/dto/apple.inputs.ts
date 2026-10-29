import { z } from "zod";

export const appleChallengeInput = z
  .object({
    nonceHash: z.string().regex(/^[a-f0-9]{64}$/u),
    purpose: z.enum(["sign-in", "link"]),
  })
  .strict();

export const nativeAppleInput = z
  .object({
    challengeId: z.uuid(),
    code: z.string().min(1).max(4096),
    nonce: z.string().min(32).max(256),
    profile: z
      .object({
        familyName: z.string().max(256).nullable(),
        givenName: z.string().max(256).nullable(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const appleNotificationInput = z
  .object({ payload: z.string().min(1).max(16_384) })
  .strict();
