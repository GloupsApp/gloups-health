CREATE TABLE "gloups_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"auth_user_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"deletion_id" uuid,
	CONSTRAINT "gloups_account_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "issued_verification" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"auth_user_id" text NOT NULL,
	"kind" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gloups_account" ADD CONSTRAINT "gloups_account_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_verification" ADD CONSTRAINT "issued_verification_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issued_verification_user_idx" ON "issued_verification" USING btree ("auth_user_id");