CREATE TABLE `synapse_entity` (
	`app_unique_id` varchar(255) NOT NULL,
	`application_name` varchar(255) NOT NULL,
	`base_state` varchar(1000) NOT NULL,
	`entity_id` varchar(255),
	`first_observed` timestamp NOT NULL DEFAULT (now()),
	`id` int AUTO_INCREMENT NOT NULL,
	`last_modified` varchar(255) NOT NULL,
	`last_reported` varchar(255) NOT NULL,
	`state_json` varchar(1000) NOT NULL,
	`unique_id` varchar(255) NOT NULL,
	CONSTRAINT `synapse_entity_id` PRIMARY KEY(`id`),
	CONSTRAINT `synapse_entity_unique_id_unique` UNIQUE(`unique_id`)
);
--> statement-breakpoint
CREATE TABLE `synapse_entity_locals` (
	`app_unique_id` varchar(255) NOT NULL,
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`last_modified` timestamp NOT NULL DEFAULT (now()),
	`unique_id` varchar(255) NOT NULL,
	`value_json` varchar(1000) NOT NULL,
	CONSTRAINT `synapse_entity_locals_id` PRIMARY KEY(`id`)
);
