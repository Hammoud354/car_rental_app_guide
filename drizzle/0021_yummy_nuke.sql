ALTER TABLE `rentalContracts` ADD `damageInspection` text;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `kmLimit` int;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `overLimitKmFee` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `overLimitKmRate` decimal(10,2) DEFAULT '0.50';