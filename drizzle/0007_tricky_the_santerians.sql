CREATE TABLE `item_special` (
	`case_number` text NOT NULL,
	`special` text NOT NULL,
	PRIMARY KEY(`case_number`, `special`),
	FOREIGN KEY (`case_number`) REFERENCES `item`(`caseNumber`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_item_special_special` ON `item_special` (`special`);
--> statement-breakpoint
INSERT OR IGNORE INTO item_special (case_number, special)
SELECT caseNumber, 'outpatient' FROM item WHERE outpatient = 1;
--> statement-breakpoint
INSERT OR IGNORE INTO item_special (case_number, special)
SELECT caseNumber, 'analgosedation' FROM item WHERE analgosedation = 1;
--> statement-breakpoint
UPDATE filter_condition SET type = 'ENUM_CONDITION', field = 'specials',
  value_enum = 'outpatient', value_boolean = NULL
WHERE field = 'outpatient' AND type = 'BOOLEAN_CONDITION' AND value_boolean = 1;
--> statement-breakpoint
UPDATE filter_condition SET type = 'ENUM_CONDITION', field = 'specials',
  value_enum = 'analgosedation', value_boolean = NULL
WHERE field = 'analgosedation' AND type = 'BOOLEAN_CONDITION' AND value_boolean = 1;
--> statement-breakpoint
DELETE FROM filter_condition WHERE field IN ('outpatient', 'analgosedation');
--> statement-breakpoint
ALTER TABLE `item` DROP COLUMN `outpatient`;
--> statement-breakpoint
ALTER TABLE `item` DROP COLUMN `analgosedation`;