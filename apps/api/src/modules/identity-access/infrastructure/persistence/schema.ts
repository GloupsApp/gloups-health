import { gloupsAccount } from "./account-schema.js";
import { appleChallenge } from "./apple-challenges.js";
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
import { deletionJob, identityTombstone } from "./deletion-schema.js";
import {
  appleNotification,
  oauthLinkAttempt,
  providerCredential,
} from "./provider-credentials-schema.js";
import { httpRateLimit } from "./rate-limit-schema.js";
import { issuedVerification } from "./verification-ledger.js";

export const schema = {
  account,
  accountRelations,
  appleChallenge,
  appleNotification,
  deletionJob,
  gloupsAccount,
  httpRateLimit,
  identityTombstone,
  issuedVerification,
  oauthLinkAttempt,
  providerCredential,
  rateLimit,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
};
