ALTER TABLE `companyProfiles` ADD `defaultCurrency` enum('USD','LOCAL') DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `companyProfiles` ADD `exchangeRate` decimal(10,4) DEFAULT '1.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE `companyProfiles` ADD `localCurrencyCode` varchar(3) DEFAULT 'LBP';