CREATE TABLE `whatsappTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateType` enum('contract_created','contract_renewed','contract_completed','invoice_generated') NOT NULL,
	`messageTemplate` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappTemplates_id` PRIMARY KEY(`id`)
);
