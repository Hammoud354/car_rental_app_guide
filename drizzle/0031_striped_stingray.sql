CREATE TABLE `contractAmendments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`userId` int NOT NULL,
	`amendmentType` enum('date_change','vehicle_change','rate_adjustment','other') NOT NULL,
	`amendmentReason` text NOT NULL,
	`previousValues` text NOT NULL,
	`newValues` text NOT NULL,
	`amountDifference` decimal(10,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractAmendments_id` PRIMARY KEY(`id`)
);
