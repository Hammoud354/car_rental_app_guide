CREATE TABLE `nationalities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nationality` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nationalities_id` PRIMARY KEY(`id`)
);
