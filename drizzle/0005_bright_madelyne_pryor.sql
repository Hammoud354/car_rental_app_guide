CREATE TYPE "public"."whishPaymentRequestStatus" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "whishPaymentRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tierId" integer NOT NULL,
	"transactionId" varchar(100) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "whishPaymentRequestStatus" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"reviewedBy" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "placeOfRegistration" varchar(200);