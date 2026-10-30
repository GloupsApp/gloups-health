import { z } from "zod";

export const accountViewSchema = z.strictObject({
  account: z.strictObject({ id: z.uuid() }),
  user: z.strictObject({
    email: z.email(),
    emailVerified: z.literal(true),
    name: z.string(),
  }),
});

export const accountQuerySchema = z.strictObject({});

export const apiErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum([
      "AUTH_REQUIRED",
      "EMAIL_UNVERIFIED",
      "INVALID_REQUEST",
      "NOT_FOUND",
      "RATE_LIMITED",
      "SERVICE_UNAVAILABLE",
    ]),
    requestId: z.uuid(),
  }),
});

export const credentialsSchema = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(15).max(128),
});

export const registrationSchema = credentialsSchema.extend({
  name: z.string().max(100),
});

export const authErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type AccountView = z.infer<typeof accountViewSchema>;

export type ApiErrorCode = z.infer<typeof apiErrorSchema>["error"]["code"];
