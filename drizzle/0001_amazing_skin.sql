CREATE TABLE `filter_condition` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filter_id` integer NOT NULL,
	`type` text NOT NULL,
	`field` text NOT NULL,
	`operator` text,
	`value_text` text,
	`value_number` real,
	`value_boolean` integer,
	`value_enum` text,
	`created_at` integer DEFAULT 1754820689761 NOT NULL,
	`updated_at` integer DEFAULT 1754820689761 NOT NULL,
	FOREIGN KEY (`filter_id`) REFERENCES `filter`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `filter` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`goal` integer,
	`created_at` integer DEFAULT 1754820689761 NOT NULL,
	`updated_at` integer DEFAULT 1754820689761 NOT NULL
);
