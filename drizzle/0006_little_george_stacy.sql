CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`nationality` varchar(100),
	`phone` varchar(20),
	`address` text,
	`drivingLicenseNumber` varchar(100) NOT NULL,
	`licenseIssueDate` timestamp,
	`licenseExpiryDate` timestamp NOT NULL,
	`email` varchar(320),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rentalContracts` MODIFY COLUMN `clientFirstName` varchar(100);--> statement-breakpoint
ALTER TABLE `rentalContracts` MODIFY COLUMN `clientLastName` varchar(100);--> statement-breakpoint
ALTER TABLE `rentalContracts` MODIFY COLUMN `drivingLicenseNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `rentalContracts` MODIFY COLUMN `licenseExpiryDate` timestamp;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `clientId` int;