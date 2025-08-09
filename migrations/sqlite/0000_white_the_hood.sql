CREATE TABLE `synapse_entity` (
	`app_unique_id` text NOT NULL,
	`application_name` text NOT NULL,
	`base_state` text NOT NULL,
	`entity_id` text,
	`first_observed` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_modified` text NOT NULL,
	`last_reported` text NOT NULL,
	`state_json` text NOT NULL,
	`unique_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `synapse_entity_unique_id_unique` ON `synapse_entity` (`unique_id`);--> statement-breakpoint
CREATE TABLE `synapse_entity_locals` (
	`app_unique_id` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`last_modified` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`unique_id` text NOT NULL,
	`value_json` text NOT NULL
);
