CREATE TABLE `item` (
	`caseNumber` text PRIMARY KEY NOT NULL,
	`ageYears` integer NOT NULL,
	`ageMonths` integer NOT NULL,
	`date` integer NOT NULL,
	`asaScore` integer NOT NULL,
	`airwayManagement` text NOT NULL,
	`department` text NOT NULL,
	`specials` text,
	`localAnesthetics` integer NOT NULL,
	`outpatient` integer NOT NULL,
	`procedure` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_caseNumber_unique` ON `item` (`caseNumber`);