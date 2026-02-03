CREATE TABLE `companySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`logo` text,
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`phone` varchar(20),
	`email` varchar(320),
	`taxId` varchar(100),
	`website` varchar(255),
	`termsAndConditions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companySettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `companySettings_userId_unique` UNIQUE(`userId`)
);
