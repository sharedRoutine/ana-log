PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_filter_condition` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filter_id` integer NOT NULL,
	`type` text NOT NULL,
	`field` text NOT NULL,
	`operator` text,
	`value_text` text,
	`value_number` real,
	`value_boolean` integer,
	`value_enum` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`filter_id`) REFERENCES `filter`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_filter_condition`("id", "filter_id", "type", "field", "operator", "value_text", "value_number", "value_boolean", "value_enum", "created_at", "updated_at") SELECT "id", "filter_id", "type", "field", "operator", "value_text", "value_number", "value_boolean", "value_enum", "created_at", "updated_at" FROM `filter_condition`;--> statement-breakpoint
DROP TABLE `filter_condition`;--> statement-breakpoint
ALTER TABLE `__new_filter_condition` RENAME TO `filter_condition`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `filter_condition_filter_id_idx` ON `filter_condition` (`filter_id`);--> statement-breakpoint
CREATE TABLE `__new_filter` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`goal` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_filter`("id", "name", "goal", "created_at", "updated_at") SELECT "id", "name", "goal", "created_at", "updated_at" FROM `filter`;--> statement-breakpoint
DROP TABLE `filter`;--> statement-breakpoint
ALTER TABLE `__new_filter` RENAME TO `filter`;--> statement-breakpoint
ALTER TABLE `item` ADD `department_other` text;--> statement-breakpoint
ALTER TABLE `item` ADD `local_anesthetics_text` text;--> statement-breakpoint
CREATE INDEX `item_date_idx` ON `item` (`date`);--> statement-breakpoint
CREATE INDEX `item_department_idx` ON `item` (`department`);--> statement-breakpoint
CREATE INDEX `item_airway_idx` ON `item` (`airwayManagement`);