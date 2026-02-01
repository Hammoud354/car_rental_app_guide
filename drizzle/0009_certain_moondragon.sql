ALTER TABLE `rentalContracts` ADD `lateFeePercentage` decimal(5,2) DEFAULT '150.00';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `lateFee` decimal(10,2) DEFAULT '0.00';