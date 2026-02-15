ALTER TABLE `vehicles` ADD `insuranceProvider` varchar(200);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `insurancePolicyStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `insuranceAnnualPremium` decimal(10,2);