ALTER TABLE "damageMarks" ADD COLUMN "symbol" varchar(10) DEFAULT 'X';--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "clientMotherFullName" varchar(200);--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "clientFatherFullName" varchar(200);--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "clientDateOfBirth" timestamp;--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "clientPlaceOfBirth" varchar(200);--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "clientRegistrationNumber" varchar(100);--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "clientPlaceOfRegistration" varchar(200);--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "licenseIssueDate" timestamp;--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD COLUMN "licenseExpiryDate" timestamp;