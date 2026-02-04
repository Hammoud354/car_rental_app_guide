CREATE TABLE `companyProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`registrationNumber` varchar(100),
	`taxId` varchar(100),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`phone` varchar(20),
	`email` varchar(320),
	`website` varchar(255),
	`logoUrl` text,
	`primaryColor` varchar(7),
	`secondaryColor` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companyProfiles_id` PRIMARY KEY(`id`)
);
