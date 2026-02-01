ALTER TABLE `rentalContracts` ADD `status` enum('Active','Returned','Archived') DEFAULT 'Active' NOT NULL;--> statement-breakpoint
ALTER TABLE `rentalContracts` ADD `returnedAt` timestamp;