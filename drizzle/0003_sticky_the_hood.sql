CREATE TABLE `damageMarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`xPosition` decimal(5,2) NOT NULL,
	`yPosition` decimal(5,2) NOT NULL,
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `damageMarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rentalContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`clientFirstName` varchar(100) NOT NULL,
	`clientLastName` varchar(100) NOT NULL,
	`clientNationality` varchar(100),
	`drivingLicenseNumber` varchar(100) NOT NULL,
	`licenseIssueDate` timestamp,
	`licenseExpiryDate` timestamp NOT NULL,
	`rentalStartDate` timestamp NOT NULL,
	`rentalEndDate` timestamp NOT NULL,
	`signatureData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rentalContracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `maintenanceRecords` ADD `kmDueMaintenance` int;--> statement-breakpoint
ALTER TABLE `maintenanceRecords` DROP COLUMN `nextServiceDue`;