ALTER TABLE `rentalContracts` ADD `insurancePackage` enum('None','Basic','Premium','Full Coverage') DEFAULT 'None';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `insuranceCost` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `insuranceDailyRate` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `depositAmount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `depositStatus` enum('None','Held','Refunded','Forfeited') DEFAULT 'None';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `depositRefundDate` timestamp;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `depositNotes` text;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `fuelPolicy` enum('Full-to-Full','Same-to-Same','Pre-purchase') DEFAULT 'Full-to-Full';--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `fuelCharge` decimal(10,2) DEFAULT '0.00';