CREATE TYPE "public"."actorType" AS ENUM('user', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."amendmentType" AS ENUM('date_change', 'vehicle_change', 'rate_adjustment', 'other');--> statement-breakpoint
CREATE TYPE "public"."contractStatus" AS ENUM('active', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."contractTemplateType" AS ENUM('pdf', 'image');--> statement-breakpoint
CREATE TYPE "public"."defaultCurrency" AS ENUM('USD', 'LOCAL');--> statement-breakpoint
CREATE TYPE "public"."depositStatus" AS ENUM('None', 'Held', 'Refunded', 'Forfeited');--> statement-breakpoint
CREATE TYPE "public"."fieldType" AS ENUM('text', 'date', 'number', 'phone');--> statement-breakpoint
CREATE TYPE "public"."fuelLevel" AS ENUM('Empty', '1/4', '1/2', '3/4', 'Full');--> statement-breakpoint
CREATE TYPE "public"."fuelPolicy" AS ENUM('Full-to-Full', 'Same-to-Same', 'Pre-purchase');--> statement-breakpoint
CREATE TYPE "public"."imageType" AS ENUM('exterior', 'interior');--> statement-breakpoint
CREATE TYPE "public"."insurancePackage" AS ENUM('None', 'Basic', 'Premium', 'Full Coverage');--> statement-breakpoint
CREATE TYPE "public"."maintenanceType" AS ENUM('Routine', 'Repair', 'Inspection', 'Emergency', 'Oil Change', 'Brake Pads Change', 'Oil + Filter');--> statement-breakpoint
CREATE TYPE "public"."numberingAuditAction" AS ENUM('generated', 'migrated', 'reset');--> statement-breakpoint
CREATE TYPE "public"."numberingType" AS ENUM('contract', 'invoice');--> statement-breakpoint
CREATE TYPE "public"."paymentStatus" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('Critical', 'Important', 'Recommended', 'Optional');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."subscriptionAction" AS ENUM('created', 'upgraded', 'downgraded', 'cancelled', 'reactivated');--> statement-breakpoint
CREATE TYPE "public"."subscriptionStatus" AS ENUM('active', 'inactive', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."taskStatus" AS ENUM('Pending', 'Completed', 'Skipped');--> statement-breakpoint
CREATE TYPE "public"."textAlignment" AS ENUM('left', 'center', 'right');--> statement-breakpoint
CREATE TYPE "public"."triggerType" AS ENUM('Mileage', 'Time', 'Both');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('Economy', 'Compact', 'Midsize', 'SUV', 'Luxury', 'Van', 'Truck');--> statement-breakpoint
CREATE TYPE "public"."vehicleStatus" AS ENUM('Available', 'Rented', 'Maintenance', 'Out of Service');--> statement-breakpoint
CREATE TYPE "public"."templateType" AS ENUM('contract_created', 'contract_renewed', 'contract_completed', 'invoice_generated');--> statement-breakpoint
CREATE TABLE "auditLogs" (
        "id" serial PRIMARY KEY NOT NULL,
        "actorId" integer NOT NULL,
        "actorUsername" varchar(100) NOT NULL,
        "actorRole" varchar(20) NOT NULL,
        "action" varchar(50) NOT NULL,
        "targetUserId" integer,
        "targetUsername" varchar(100),
        "details" text NOT NULL,
        "previousState" text,
        "newState" text,
        "ipAddress" varchar(45),
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carMakers" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "country" varchar(100) NOT NULL,
        "isCustom" boolean DEFAULT false NOT NULL,
        "userId" integer,
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carModels" (
        "id" serial PRIMARY KEY NOT NULL,
        "makerId" integer NOT NULL,
        "modelName" varchar(100) NOT NULL,
        "year" integer,
        "isCustom" boolean DEFAULT false NOT NULL,
        "userId" integer,
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "name" varchar(200) NOT NULL,
        "phone" varchar(20),
        "email" varchar(320),
        "nationality" varchar(100),
        "driverLicenseNumber" varchar(100),
        "passportNumber" varchar(100),
        "idNumber" varchar(100),
        "address" text,
        "notes" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companyProfiles" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "companyName" varchar(255) NOT NULL,
        "registrationNumber" varchar(100),
        "taxId" varchar(100),
        "address" text,
        "city" varchar(100),
        "country" varchar(100),
        "phone" varchar(20),
        "email" varchar(320),
        "website" varchar(255),
        "logoUrl" text,
        "primaryColor" varchar(7),
        "secondaryColor" varchar(7),
        "contractTemplateUrl" text,
        "contractTemplateFieldMap" json,
        "defaultCurrency" "defaultCurrency" DEFAULT 'USD' NOT NULL,
        "exchangeRate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
        "localCurrencyCode" varchar(3) DEFAULT 'LBP',
        "vatRate" numeric(5, 2) DEFAULT '11.00' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companySettings" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "companyName" varchar(255) NOT NULL,
        "logo" text,
        "address" text,
        "city" varchar(100),
        "country" varchar(100),
        "phone" varchar(20),
        "email" varchar(320),
        "taxId" varchar(100),
        "website" varchar(255),
        "termsAndConditions" text,
        "exchangeRateLbpToUsd" numeric(10, 2) DEFAULT '89700.00' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "companySettings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "contractAmendments" (
        "id" serial PRIMARY KEY NOT NULL,
        "contractId" integer NOT NULL,
        "userId" integer NOT NULL,
        "amendmentType" "amendmentType" NOT NULL,
        "amendmentReason" text NOT NULL,
        "previousValues" text NOT NULL,
        "newValues" text NOT NULL,
        "amountDifference" numeric(10, 2) DEFAULT '0.00',
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractTemplates" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "templateName" varchar(255) NOT NULL,
        "templateUrl" text NOT NULL,
        "templateType" "contractTemplateType" NOT NULL,
        "templateWidth" integer NOT NULL,
        "templateHeight" integer NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damageMarks" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "contractId" integer NOT NULL,
        "xPosition" numeric(5, 2) NOT NULL,
        "yPosition" numeric(5, 2) NOT NULL,
        "description" varchar(500),
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboardPreferences" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "widgetId" varchar(100) NOT NULL,
        "position" integer NOT NULL,
        "isVisible" boolean DEFAULT true NOT NULL,
        "settings" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generatedContracts" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "rentalContractId" integer NOT NULL,
        "templateId" integer NOT NULL,
        "pdfUrl" text NOT NULL,
        "pdfFileName" varchar(255) NOT NULL,
        "filledData" text,
        "generatedAt" timestamp DEFAULT now() NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurancePolicies" (
        "id" serial PRIMARY KEY NOT NULL,
        "vehicleId" integer NOT NULL,
        "userId" integer NOT NULL,
        "policyNumber" varchar(100),
        "insuranceProvider" varchar(200),
        "policyStartDate" timestamp NOT NULL,
        "policyEndDate" timestamp NOT NULL,
        "annualPremium" numeric(10, 2),
        "notes" text,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoiceLineItems" (
        "id" serial PRIMARY KEY NOT NULL,
        "invoiceId" integer NOT NULL,
        "description" text NOT NULL,
        "quantity" numeric(10, 2) NOT NULL,
        "unitPrice" numeric(10, 2) NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "contractId" integer NOT NULL,
        "invoiceNumber" varchar(50) NOT NULL,
        "invoiceDate" date NOT NULL,
        "dueDate" date NOT NULL,
        "subtotal" numeric(10, 2) NOT NULL,
        "taxAmount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
        "totalAmount" numeric(10, 2) NOT NULL,
        "paymentStatus" "paymentStatus" DEFAULT 'pending' NOT NULL,
        "paymentMethod" varchar(50),
        "paidAt" timestamp,
        "notes" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "invoices_invoiceNumber_unique" UNIQUE("invoiceNumber")
);
--> statement-breakpoint
CREATE TABLE "maintenanceRecords" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "vehicleId" integer NOT NULL,
        "maintenanceType" "maintenanceType" NOT NULL,
        "description" text NOT NULL,
        "cost" numeric(10, 2),
        "performedAt" timestamp NOT NULL,
        "performedBy" varchar(200),
        "garageLocation" varchar(300),
        "mileageAtService" integer,
        "kmDueMaintenance" integer,
        "garageEntryDate" timestamp,
        "garageExitDate" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenanceTasks" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "vehicleId" integer NOT NULL,
        "taskName" varchar(200) NOT NULL,
        "description" text,
        "priority" "priority" NOT NULL,
        "category" varchar(100),
        "estimatedCost" numeric(10, 2),
        "estimatedDuration" integer,
        "triggerType" "triggerType" NOT NULL,
        "triggerMileage" integer,
        "triggerDate" timestamp,
        "status" "taskStatus" DEFAULT 'Pending' NOT NULL,
        "completedAt" timestamp,
        "completedMileage" integer,
        "actualCost" numeric(10, 2),
        "maintenanceRecordId" integer,
        "aiGenerated" boolean DEFAULT true NOT NULL,
        "aiReasoning" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nationalities" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "nationality" varchar(100) NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "numberingAudit" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "numberType" "numberingType" NOT NULL,
        "action" "numberingAuditAction" NOT NULL,
        "generatedNumber" varchar(100) NOT NULL,
        "sequentialNumber" integer NOT NULL,
        "relatedId" integer,
        "previousNumber" integer,
        "newNumber" integer,
        "reason" text,
        "actorId" integer,
        "actorUsername" varchar(100),
        "ipAddress" varchar(45),
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "numberingCounters" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "lastContractNumber" integer DEFAULT 0 NOT NULL,
        "lastInvoiceNumber" integer DEFAULT 0 NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "numberingCounters_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "passwordResetTokens" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "token" varchar(255) NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "used" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "passwordResetTokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "rentalContracts" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "vehicleId" integer NOT NULL,
        "clientId" integer,
        "clientName" varchar(200) NOT NULL,
        "clientPhone" varchar(20),
        "clientEmail" varchar(320),
        "clientNationality" varchar(100),
        "clientDriverLicense" varchar(100),
        "clientPassport" varchar(100),
        "clientId2" varchar(100),
        "clientAddress" text,
        "rentalStartDate" timestamp NOT NULL,
        "rentalEndDate" timestamp NOT NULL,
        "rentalDays" integer NOT NULL,
        "pickupTime" varchar(20),
        "returnTime" varchar(20),
        "dailyRate" numeric(10, 2) NOT NULL,
        "totalAmount" numeric(10, 2) NOT NULL,
        "discount" numeric(10, 2) DEFAULT '0.00',
        "finalAmount" numeric(10, 2) NOT NULL,
        "contractNumber" varchar(50) NOT NULL,
        "signatureData" text,
        "vehicleType" varchar(50),
        "vehicleColor" varchar(50),
        "vehicleFuelType" varchar(50),
        "vehicleVIN" varchar(17),
        "fuelLevel" "fuelLevel" DEFAULT 'Full',
        "returnFuelLevel" "fuelLevel",
        "pickupKm" integer,
        "returnKm" integer,
        "returnNotes" text,
        "damageInspection" text,
        "kmLimit" integer,
        "overLimitKmFee" numeric(10, 2) DEFAULT '0.00',
        "overLimitKmRate" numeric(10, 2) DEFAULT '0.50',
        "lateFeePercentage" numeric(5, 2) DEFAULT '150.00',
        "lateFee" numeric(10, 2) DEFAULT '0.00',
        "insurancePackage" "insurancePackage" DEFAULT 'None',
        "insuranceCost" numeric(10, 2) DEFAULT '0.00',
        "insuranceDailyRate" numeric(10, 2) DEFAULT '0.00',
        "depositAmount" numeric(10, 2) DEFAULT '0.00',
        "depositStatus" "depositStatus" DEFAULT 'None',
        "depositRefundDate" timestamp,
        "depositNotes" text,
        "fuelPolicy" "fuelPolicy" DEFAULT 'Full-to-Full',
        "fuelCharge" numeric(10, 2) DEFAULT '0.00',
        "status" "contractStatus" DEFAULT 'active' NOT NULL,
        "returnedAt" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptionAuditLog" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "previousTierId" integer,
        "newTierId" integer NOT NULL,
        "action" "subscriptionAction" NOT NULL,
        "reason" text,
        "actorId" integer,
        "actorType" "actorType" NOT NULL,
        "ipAddress" varchar(45),
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptionTiers" (
        "id" serial PRIMARY KEY NOT NULL,
        "tierName" varchar(50) NOT NULL,
        "displayName" varchar(100) NOT NULL,
        "description" text,
        "monthlyPrice" numeric(10, 2) NOT NULL,
        "maxVehicles" integer,
        "maxClients" integer,
        "maxUsers" integer,
        "features" json,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "subscriptionTiers_tierName_unique" UNIQUE("tierName")
);
--> statement-breakpoint
CREATE TABLE "templateFields" (
        "id" serial PRIMARY KEY NOT NULL,
        "templateId" integer NOT NULL,
        "fieldName" varchar(100) NOT NULL,
        "fieldLabel" varchar(200) NOT NULL,
        "fieldType" "fieldType" DEFAULT 'text' NOT NULL,
        "positionX" integer NOT NULL,
        "positionY" integer NOT NULL,
        "width" integer NOT NULL,
        "height" integer NOT NULL,
        "fontSize" integer DEFAULT 12 NOT NULL,
        "fontFamily" varchar(50) DEFAULT 'Arial' NOT NULL,
        "textAlignment" "textAlignment" DEFAULT 'left' NOT NULL,
        "fontColor" varchar(7) DEFAULT '#000000' NOT NULL,
        "isRequired" boolean DEFAULT false NOT NULL,
        "displayOrder" integer DEFAULT 0 NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userSubscriptions" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "tierId" integer NOT NULL,
        "status" "subscriptionStatus" DEFAULT 'active' NOT NULL,
        "startDate" timestamp DEFAULT now() NOT NULL,
        "renewalDate" timestamp,
        "cancelledAt" timestamp,
        "reason" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "userSubscriptions_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "openId" varchar(64),
        "username" varchar(100) NOT NULL,
        "password" varchar(255),
        "name" text,
        "email" varchar(320),
        "phone" varchar(20),
        "countryCode" varchar(10),
        "country" varchar(100),
        "loginMethod" varchar(64),
        "role" "role" DEFAULT 'user' NOT NULL,
        "isInternal" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        "lastSignedIn" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_openId_unique" UNIQUE("openId"),
        CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicleImages" (
        "id" serial PRIMARY KEY NOT NULL,
        "vehicleId" integer NOT NULL,
        "userId" integer NOT NULL,
        "imageUrl" text NOT NULL,
        "imageType" "imageType" NOT NULL,
        "displayOrder" integer DEFAULT 0,
        "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "plateNumber" varchar(20) NOT NULL,
        "brand" varchar(100) NOT NULL,
        "model" varchar(100) NOT NULL,
        "year" integer NOT NULL,
        "color" varchar(50) NOT NULL,
        "category" "category" NOT NULL,
        "status" "vehicleStatus" DEFAULT 'Available' NOT NULL,
        "dailyRate" numeric(10, 2) NOT NULL,
        "weeklyRate" numeric(10, 2),
        "monthlyRate" numeric(10, 2),
        "mileage" integer DEFAULT 0,
        "vin" varchar(17),
        "insurancePolicyNumber" varchar(100),
        "insuranceProvider" varchar(200),
        "insurancePolicyStartDate" timestamp,
        "insuranceExpiryDate" timestamp,
        "insuranceAnnualPremium" numeric(10, 2),
        "insuranceCost" numeric(10, 2),
        "purchaseCost" numeric(10, 2),
        "registrationExpiryDate" timestamp,
        "engineType" varchar(50),
        "transmission" varchar(50),
        "fuelType" varchar(50),
        "engineSize" varchar(20),
        "purchaseDate" timestamp,
        "averageDailyKm" integer,
        "usagePattern" varchar(50),
        "climate" varchar(50),
        "lastServiceDate" timestamp,
        "lastServiceKm" integer,
        "nextMaintenanceDate" timestamp,
        "nextMaintenanceKm" integer,
        "maintenanceIntervalKm" integer DEFAULT 5000,
        "maintenanceIntervalMonths" integer DEFAULT 6,
        "aiMaintenanceEnabled" boolean DEFAULT true,
        "photoUrl" text,
        "notes" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "vehicles_plateNumber_unique" UNIQUE("plateNumber")
);
--> statement-breakpoint
CREATE TABLE "whatsappTemplates" (
        "id" serial PRIMARY KEY NOT NULL,
        "userId" integer NOT NULL,
        "templateType" "templateType" NOT NULL,
        "messageTemplate" text NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carModels" ADD CONSTRAINT "carModels_makerId_carMakers_id_fk" FOREIGN KEY ("makerId") REFERENCES "public"."carMakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carModels" ADD CONSTRAINT "carModels_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companySettings" ADD CONSTRAINT "companySettings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damageMarks" ADD CONSTRAINT "damageMarks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damageMarks" ADD CONSTRAINT "damageMarks_contractId_rentalContracts_id_fk" FOREIGN KEY ("contractId") REFERENCES "public"."rentalContracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_rentalContracts_id_fk" FOREIGN KEY ("contractId") REFERENCES "public"."rentalContracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenanceRecords" ADD CONSTRAINT "maintenanceRecords_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenanceRecords" ADD CONSTRAINT "maintenanceRecords_vehicleId_vehicles_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenanceTasks" ADD CONSTRAINT "maintenanceTasks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenanceTasks" ADD CONSTRAINT "maintenanceTasks_vehicleId_vehicles_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD CONSTRAINT "rentalContracts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD CONSTRAINT "rentalContracts_vehicleId_vehicles_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentalContracts" ADD CONSTRAINT "rentalContracts_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;