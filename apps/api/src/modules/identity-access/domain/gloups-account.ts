export class GloupsAccount {
  readonly id: string;
  readonly authUserId: string;
  readonly createdAtMs: number;
  readonly deletionId: string | null;
  private constructor(
    id: string,
    authUserId: string,
    createdAtMs: number,
    deletionId: string | null
  ) {
    this.id = id;
    this.authUserId = authUserId;
    this.createdAtMs = createdAtMs;
    this.deletionId = deletionId;

    if (!id || !authUserId || !Number.isFinite(createdAtMs)) {
      throw new Error("Invalid account identity.");
    }

    Object.freeze(this);
  }
  static create(
    id: string,
    authUserId: string,
    createdAtMs: number
  ): GloupsAccount {
    return new GloupsAccount(id, authUserId, createdAtMs, null);
  }
  static restore(value: {
    id: string;
    authUserId: string;
    createdAtMs: number;
    deletionId: string | null;
  }): GloupsAccount {
    return new GloupsAccount(
      value.id,
      value.authUserId,
      value.createdAtMs,
      value.deletionId
    );
  }
  get isDeleting(): boolean {
    return this.deletionId !== null;
  }
  beginDeletion(deletionId: string): GloupsAccount {
    if (
      !deletionId ||
      (this.deletionId !== null && this.deletionId !== deletionId)
    ) {
      throw new Error("Conflicting account deletion.");
    }

    return new GloupsAccount(
      this.id,
      this.authUserId,
      this.createdAtMs,
      deletionId
    );
  }
}
