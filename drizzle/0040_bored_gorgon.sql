ALTER TABLE `rentalContracts` ADD `clientMotherFullName` varchar(200);--> statement-breakpoint
ALTER TABLE `rentalContracts` DROP COLUMN `clientFamilyName`;--> statement-breakpoint
ALTER TABLE `rentalContracts` DROP COLUMN `clientMotherName`;