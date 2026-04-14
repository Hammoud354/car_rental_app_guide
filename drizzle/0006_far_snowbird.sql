CREATE TABLE "highSeasonPeriods" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "highSeasonDailyRate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "highSeasonWeeklyRate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "highSeasonMonthlyRate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "highSeasonPeriods" ADD CONSTRAINT "highSeasonPeriods_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;