import { createHmac } from "node:crypto";

import type { ApiConfig } from "../../../../config.js";

export const identityFingerprint = (
  config: Pick<ApiConfig, "fingerprintSecret">,
  kind: "email" | "identity" | "subject",
  value: string
): string =>
  createHmac("sha256", config.fingerprintSecret)
    .update(`${kind}:${value}`)
    .digest("hex");
