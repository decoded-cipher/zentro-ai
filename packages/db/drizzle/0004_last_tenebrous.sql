ALTER TABLE "user" ADD COLUMN "created_at" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" integer NOT NULL;--> statement-breakpoint
CREATE INDEX "clerk_id_idx" ON "user" USING btree ("clerk_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "clerk_id_unique" UNIQUE("clerk_id");