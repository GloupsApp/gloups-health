import { z } from "zod";

export const emailMessageSchema = z.strictObject({
  kind: z.enum(["verification", "password-reset"]),
  recipient: z.email(),
  url: z.url(),
});

export type EmailMessage = z.infer<typeof emailMessageSchema>;
