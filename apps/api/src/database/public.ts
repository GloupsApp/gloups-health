import {
  account,
  gloupsAccount,
  rateLimit,
  session,
  user,
  verification,
} from "@database/schema";

export { createDatabase, IDENTITY_DATABASE } from "@database/database";

export type { Database } from "@database/database";

export { gloupsAccount } from "@database/schema";

export const authSchema = {
  account,
  gloupsAccount,
  rateLimit,
  session,
  user,
  verification,
};
