import {
  account,
  gloupsAccount,
  rateLimit,
  session,
  user,
  verification,
} from "./schema.js";

export { createDatabase } from "./database.js";

export type { Database } from "./database.js";

export { gloupsAccount } from "./schema.js";

export const authSchema = {
  account,
  gloupsAccount,
  rateLimit,
  session,
  user,
  verification,
};
