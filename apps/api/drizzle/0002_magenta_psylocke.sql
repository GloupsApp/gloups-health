CREATE TABLE "apple_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_link_attempt" (
	"auth_user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_credential" (
	"apple_subject" text NOT NULL,
	"auth_user_id" text,
	"ciphertext" text,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expected_actor_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"phase" text NOT NULL,
	"retry_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apple_challenge" (
	"actor_auth_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"nonce_hash" text NOT NULL,
	"purpose" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "identity_fingerprint" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "native_setup_id" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "subject_fingerprint" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "identity_fingerprint" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "native_setup_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_fingerprint" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "native_setup_id" text;--> statement-breakpoint
ALTER TABLE "oauth_link_attempt" ADD CONSTRAINT "oauth_link_attempt_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_credential_owner_idx" ON "provider_credential" USING btree ("auth_user_id");--> statement-breakpoint
CREATE INDEX "provider_credential_subject_idx" ON "provider_credential" USING btree ("apple_subject");--> statement-breakpoint
CREATE INDEX "provider_credential_retry_idx" ON "provider_credential" USING btree ("phase","retry_at");