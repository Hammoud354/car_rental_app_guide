CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`actorUsername` varchar(100) NOT NULL,
	`actorRole` varchar(20) NOT NULL,
	`action` varchar(50) NOT NULL,
	`targetUserId` int,
	`targetUsername` varchar(100),
	`details` text NOT NULL,
	`previousState` text,
	`newState` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
