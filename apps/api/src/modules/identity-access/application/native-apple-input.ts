export interface AppleChallengeInput {
  nonceHash: string;
  purpose: "sign-in" | "link";
}

export interface NativeAppleInput {
  challengeId: string;
  code: string;
  nonce: string;
  profile?: { familyName: string | null; givenName: string | null } | undefined;
}
