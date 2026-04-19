ALTER TABLE "users" ADD COLUMN "isTemporaryDemo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "demoExpiresAt" timestamp;