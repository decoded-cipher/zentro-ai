ALTER TABLE "user" RENAME COLUMN "name" TO "clerk_id";--> statement-breakpoint
CREATE INDEX "email_idx" ON "user" USING btree ("email");