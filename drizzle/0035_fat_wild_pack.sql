CREATE TABLE `insurancePolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`userId` int NOT NULL,
	`policyNumber` varchar(100),
	`insuranceProvider` varchar(200),
	`policyStartDate` timestamp NOT NULL,
	`policyEndDate` timestamp NOT NULL,
	`annualPremium` decimal(10,2) NOT NULL,
	`status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurancePolicies_id` PRIMARY KEY(`id`)
);
