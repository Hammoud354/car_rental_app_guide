CREATE TABLE `contractTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`templateUrl` text NOT NULL,
	`templateType` enum('pdf','image') NOT NULL,
	`templateWidth` int NOT NULL,
	`templateHeight` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rentalContractId` int NOT NULL,
	`templateId` int NOT NULL,
	`pdfUrl` text NOT NULL,
	`pdfFileName` varchar(255) NOT NULL,
	`filledData` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedContracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`fieldLabel` varchar(200) NOT NULL,
	`fieldType` enum('text','date','number','phone') NOT NULL DEFAULT 'text',
	`positionX` int NOT NULL,
	`positionY` int NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`fontSize` int NOT NULL DEFAULT 12,
	`fontFamily` varchar(50) NOT NULL DEFAULT 'Arial',
	`textAlignment` enum('left','center','right') NOT NULL DEFAULT 'left',
	`fontColor` varchar(7) NOT NULL DEFAULT '#000000',
	`isRequired` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templateFields_id` PRIMARY KEY(`id`)
);
