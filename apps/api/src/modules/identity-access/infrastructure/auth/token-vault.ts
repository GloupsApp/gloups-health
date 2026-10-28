import { CompactEncrypt, compactDecrypt, decodeProtectedHeader } from "jose";
import { z } from "zod";

import type { TokenKeyring } from "../../../../config.js";

const credentialSchema = z.object({
  clientId: z.string().min(1),
  refreshToken: z.string().min(1),
  subject: z.string().min(1),
});

const headerSchema = z.object({
  alg: z.literal("dir"),
  enc: z.literal("A256GCM"),
  kid: z.string().min(1),
});

export type AppleRevocationCredential = z.infer<typeof credentialSchema>;

export const createTokenVault = (keyring: TokenKeyring) => ({
  async open(ciphertext: string): Promise<AppleRevocationCredential> {
    const header = headerSchema.parse(decodeProtectedHeader(ciphertext));

    if (!Object.hasOwn(keyring.keys, header.kid)) {
      throw new Error("Unknown credential key.");
    }

    const key = z.string().parse(keyring.keys[header.kid]);

    const { plaintext } = await compactDecrypt(
      ciphertext,
      Buffer.from(key, "base64url"),
      {
        contentEncryptionAlgorithms: ["A256GCM"],
        keyManagementAlgorithms: ["dir"],
      }
    );

    return credentialSchema.parse(
      JSON.parse(new TextDecoder().decode(plaintext))
    );
  },
  seal(credential: AppleRevocationCredential): Promise<string> {
    const key = z.string().parse(keyring.keys[keyring.activeKid]);

    return new CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(credential))
    )
      .setProtectedHeader({
        alg: "dir",
        enc: "A256GCM",
        kid: keyring.activeKid,
      })
      .encrypt(Buffer.from(key, "base64url"));
  },
});
