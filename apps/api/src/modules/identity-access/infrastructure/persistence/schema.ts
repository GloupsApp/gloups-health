import { gloupsAccount } from "./account-schema.js";
import {
  account,
  accountRelations,
  rateLimit,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./auth-schema.js";
import { httpRateLimit } from "./rate-limit-schema.js";
import { issuedVerification } from "./verification-ledger.js";

export const schema = {
  account,
  accountRelations,
  gloupsAccount,
  httpRateLimit,
  issuedVerification,
  rateLimit,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
};
