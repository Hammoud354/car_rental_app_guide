ALTER TABLE "rentalContracts" ADD COLUMN "secondDriverName" varchar(200);--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "secondDriverDateOfBirth" timestamp;--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "secondDriverLicenseIssueDate" timestamp;--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "secondDriverLicenseExpiryDate" timestamp;