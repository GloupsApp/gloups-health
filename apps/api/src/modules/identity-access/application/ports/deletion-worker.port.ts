import type { DeletionRepository } from "../../domain/deletion-job.js";

export const DELETION_JOBS = Symbol("DELETION_JOBS");
export const IDENTITY_REMOVAL = Symbol("IDENTITY_REMOVAL");
export const APPLE_REVOCATION = Symbol("APPLE_REVOCATION");

export type DeletionJobs = Pick<DeletionRepository, "claim" | "save">;
