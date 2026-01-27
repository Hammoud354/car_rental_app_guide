CREATE TABLE `maintenanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`maintenanceType` enum('Routine','Repair','Inspection','Emergency') NOT NULL,
	`description` text NOT NULL,
	`cost` decimal(10,2),
	`performedAt` timestamp NOT NULL,
	`performedBy` varchar(200),
	`mileageAtService` int,
	`nextServiceDue` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plateNumber` varchar(20) NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`year` int NOT NULL,
	`color` varchar(50) NOT NULL,
	`category` enum('Economy','Compact','Midsize','SUV','Luxury','Van','Truck') NOT NULL,
	`status` enum('Available','Rented','Maintenance','Out of Service') NOT NULL DEFAULT 'Available',
	`dailyRate` decimal(10,2) NOT NULL,
	`weeklyRate` decimal(10,2),
	`monthlyRate` decimal(10,2),
	`mileage` int DEFAULT 0,
	`vin` varchar(17),
	`insurancePolicyNumber` varchar(100),
	`insuranceExpiryDate` timestamp,
	`registrationExpiryDate` timestamp,
	`photoUrl` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_plateNumber_unique` UNIQUE(`plateNumber`)
);
