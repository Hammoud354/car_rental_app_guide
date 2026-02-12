CREATE TABLE `dashboardPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`widgetId` varchar(100) NOT NULL,
	`position` int NOT NULL,
	`isVisible` boolean NOT NULL DEFAULT true,
	`settings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboardPreferences_id` PRIMARY KEY(`id`)
);
