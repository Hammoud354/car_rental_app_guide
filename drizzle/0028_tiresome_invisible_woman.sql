ALTER TABLE `vehicles` ADD `nextMaintenanceDate` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `nextMaintenanceKm` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `maintenanceIntervalKm` int DEFAULT 5000;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `maintenanceIntervalMonths` int DEFAULT 6;