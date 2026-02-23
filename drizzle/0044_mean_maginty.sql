ALTER TABLE `rentalContracts` ADD `clientDateOfBirth` date;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `clientPassportNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `clientPlaceOfBirth` varchar(200);--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `pickupTime` varchar(20);--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `returnTime` varchar(20);--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `vehicleType` varchar(50);--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `vehicleColor` varchar(50);--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `vehicleFuelType` varchar(50);--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `vehicleVIN` varchar(17);