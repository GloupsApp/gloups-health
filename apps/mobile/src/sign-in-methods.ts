import { z } from "zod";

import { errorMessage } from "./auth-actions";
import { authClient } from "./auth-client";

export const providerSchema = z.enum(["apple", "google"]);

const methodSchema = z.object({
  available: z.boolean(),
  id: z.string(),
  providerId: z.string(),
});

export type SignInMethod = z.infer<typeof methodSchema>;

export const loadProviders = async () => {
  const response = await authClient.$fetch<unknown>("/providers");

  if (response.error) {
    throw new Error(errorMessage(response.error));
  }

  return providerSchema.array().parse(response.data);
};

export const loadMethods = async () => {
  const response = await authClient.$fetch<unknown>("/methods");

  if (response.error) {
    throw new Error(errorMessage(response.error));
  }

  return methodSchema.array().parse(response.data);
};

export const changeMethod = async (
  path: "/methods/password" | "/methods/unlink",
  body: Record<string, string>
) => {
  const response = await authClient.$fetch(path, { body, method: "POST" });

  if (response.error) {
    throw new Error(errorMessage(response.error));
  }
};
