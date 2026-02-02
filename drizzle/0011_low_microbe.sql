ALTER TABLE `maintenanceRecords` MODIFY COLUMN `maintenanceType` enum('Routine','Repair','Inspection','Emergency','Oil Change','Brake Pads Change','Oil + Filter') NOT NULL;--> statement-breakpoint
ALTER TABLE `maintenanceRecords` ADD `garageEntryDate` timestamp;--> statement-breakpoint
ALTER TABLE `maintenanceRecords` ADD `garageExitDate` timestamp;