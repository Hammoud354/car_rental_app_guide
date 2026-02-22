ALTER TABLE `clients` ADD `fatherName` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `motherFullName` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `fullName`;