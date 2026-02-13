CREATE TABLE `maintenanceTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`taskName` varchar(200) NOT NULL,
	`description` text,
	`priority` enum('Critical','Important','Recommended','Optional') NOT NULL,
	`category` varchar(100),
	`estimatedCost` decimal(10,2),
	`estimatedDuration` int,
	`triggerType` enum('Mileage','Time','Both') NOT NULL,
	`triggerMileage` int,
	`triggerDate` timestamp,
	`intervalMileage` int,
	`intervalMonths` int,
	`status` enum('Pending','Overdue','Completed','Skipped','Dismissed') NOT NULL DEFAULT 'Pending',
	`completedAt` timestamp,
	`completedMileage` int,
	`actualCost` decimal(10,2),
	`aiGenerated` boolean DEFAULT true,
	`aiReasoning` text,
	`userOverridden` boolean DEFAULT false,
	`overrideNotes` text,
	`maintenanceRecordId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vehicles` ADD `engineType` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `transmission` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `fuelType` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `engineSize` varchar(20);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `purchaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `averageDailyKm` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `usagePattern` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `climate` varchar(50);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `lastServiceDate` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `lastServiceKm` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `aiMaintenanceEnabled` boolean DEFAULT true;