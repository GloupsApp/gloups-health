import { importPKCS8, SignJWT } from "jose";

import type { AppleConfiguration } from "../../../../config.js";

export const appleClientSecret = async (
  config: AppleConfiguration,
  clientId: string
): Promise<string> => {
  const key = await importPKCS8(config.privateKey, "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId })
    .setIssuer(config.teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
};
