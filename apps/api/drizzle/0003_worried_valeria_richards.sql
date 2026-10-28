CREATE TABLE "deletion_job" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"actor_fingerprint" text NOT NULL,
	"apple_revocation" text NOT NULL,
	"attempts" integer NOT NULL,
	"auth_user_id" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"credential_refs" jsonb NOT NULL,
	"gloups" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"lease_id" uuid,
	"lease_until" timestamp with time zone,
	"requires_manual" boolean NOT NULL,
	"retry_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_tombstone" (
	"fingerprint" text PRIMARY KEY NOT NULL,
	"deletion_id" uuid NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "provider_fingerprint" text;--> statement-breakpoint
CREATE UNIQUE INDEX "deletion_actor_key_idx" ON "deletion_job" USING btree ("actor_fingerprint","idempotency_key");--> statement-breakpoint
CREATE INDEX "deletion_retry_idx" ON "deletion_job" USING btree ("retry_at","lease_until");