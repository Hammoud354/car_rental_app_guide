ALTER TABLE `rentalContracts` ADD `rentalDays` int NOT NULL;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `dailyRate` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `totalAmount` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `discount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `finalAmount` decimal(10,2) NOT NULL;