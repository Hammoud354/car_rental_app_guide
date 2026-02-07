CREATE TABLE `vehicleImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageType` enum('exterior','interior') NOT NULL,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicleImages_id` PRIMARY KEY(`id`)
);
