CREATE TABLE `invoiceLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contractId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`invoiceDate` date NOT NULL,
	`dueDate` date NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`taxAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(10,2) NOT NULL,
	`paymentStatus` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paidAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
