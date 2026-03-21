ALTER TABLE "clients" ADD COLUMN "fatherName" varchar(200);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "motherFullName" varchar(200);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "dateOfBirth" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "placeOfBirth" varchar(200);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "licenseIssueDate" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "licenseExpiryDate" timestamp;