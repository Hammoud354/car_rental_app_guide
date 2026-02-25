CREATE TABLE `numberingAudit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`numberType` enum('contract','invoice') NOT NULL,
	`action` enum('generated','migrated','reset') NOT NULL,
	`generatedNumber` varchar(50) NOT NULL,
	`sequentialNumber` int NOT NULL,
	`relatedId` int,
	`previousNumber` int,
	`newNumber` int,
	`reason` text,
	`actorId` int,
	`actorUsername` varchar(100),
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `numberingAudit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `numberingCounters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lastContractNumber` int NOT NULL DEFAULT 0,
	`lastInvoiceNumber` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `numberingCounters_id` PRIMARY KEY(`id`),
	CONSTRAINT `numberingCounters_userId_unique` UNIQUE(`userId`)
);
