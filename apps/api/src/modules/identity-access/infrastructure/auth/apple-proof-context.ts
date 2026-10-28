import { AsyncLocalStorage } from "node:async_hooks";

interface NativeAppleProof {
  readonly actorSessionId: string | null;
  readonly actorAuthUserId: string | null;
  readonly intentId: string;
}

const proofScope = new AsyncLocalStorage<NativeAppleProof>();

export const nativeAppleProof = () => proofScope.getStore();

export const withNativeAppleProof = <T>(
  proof: NativeAppleProof,
  work: () => Promise<T>
): Promise<T> => proofScope.run(proof, work);
