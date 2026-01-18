-- Create medical_case table
CREATE TABLE `medical_case` (
	`case_number` text PRIMARY KEY NOT NULL,
	`age_years` integer NOT NULL,
	`age_months` integer NOT NULL,
	`favorite` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medical_case_case_number_unique` ON `medical_case` (`case_number`);
--> statement-breakpoint
-- Populate medical_case from existing items
INSERT INTO `medical_case` (`case_number`, `age_years`, `age_months`, `favorite`)
SELECT `caseNumber`, `ageYears`, `ageMonths`, `favorite` FROM `item`;
--> statement-breakpoint
-- Create new procedure table
CREATE TABLE `procedure` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_number` text NOT NULL,
	`age_years` integer NOT NULL,
	`age_months` integer NOT NULL,
	`date` integer NOT NULL,
	`asa_score` integer NOT NULL,
	`airway_management` text NOT NULL,
	`department` text NOT NULL,
	`department_other` text,
	`specials` text,
	`local_anesthetics` integer NOT NULL,
	`local_anesthetics_text` text,
	`emergency` integer DEFAULT false NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`procedure` text NOT NULL,
	FOREIGN KEY (`case_number`) REFERENCES `medical_case`(`case_number`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `procedure_date_idx` ON `procedure` (`date`);
--> statement-breakpoint
CREATE INDEX `procedure_department_idx` ON `procedure` (`department`);
--> statement-breakpoint
CREATE INDEX `procedure_airway_idx` ON `procedure` (`airway_management`);
--> statement-breakpoint
CREATE INDEX `procedure_case_number_idx` ON `procedure` (`case_number`);
--> statement-breakpoint
-- Copy data from item to procedure
INSERT INTO `procedure` (`case_number`, `age_years`, `age_months`, `date`, `asa_score`, `airway_management`, `department`, `department_other`, `specials`, `local_anesthetics`, `local_anesthetics_text`, `emergency`, `favorite`, `procedure`)
SELECT `caseNumber`, `ageYears`, `ageMonths`, `date`, `asaScore`, `airwayManagement`, `department`, `department_other`, `specials`, `localAnesthetics`, `local_anesthetics_text`, `emergency`, `favorite`, `procedure` FROM `item`;
--> statement-breakpoint
-- Create new procedure_special table
CREATE TABLE `procedure_special` (
	`procedure_id` integer NOT NULL,
	`special` text NOT NULL,
	PRIMARY KEY(`procedure_id`, `special`),
	FOREIGN KEY (`procedure_id`) REFERENCES `procedure`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_procedure_special_special` ON `procedure_special` (`special`);
--> statement-breakpoint
-- Migrate item_special to procedure_special by joining on case_number
INSERT INTO `procedure_special` (`procedure_id`, `special`)
SELECT p.`id`, isp.`special`
FROM `item_special` isp
JOIN `procedure` p ON p.`case_number` = isp.`case_number`;
--> statement-breakpoint
-- Drop old tables
DROP TABLE `item_special`;
--> statement-breakpoint
DROP TABLE `item`;