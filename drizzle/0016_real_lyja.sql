ALTER TABLE `clients` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `damageMarks` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `maintenanceRecords` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `userId` int NOT NULL;