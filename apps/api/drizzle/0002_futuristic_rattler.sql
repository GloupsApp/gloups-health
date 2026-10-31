CREATE TABLE "auth_provider_revocation" (
	"id" text PRIMARY KEY NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_subject_idx" ON "auth_account" USING btree ("provider_id","account_id");