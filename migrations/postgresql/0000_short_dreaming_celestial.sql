CREATE TABLE "synapse_entity" (
	"app_unique_id" text NOT NULL,
	"application_name" text NOT NULL,
	"base_state" text NOT NULL,
	"entity_id" text,
	"first_observed" timestamp DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"last_modified" text NOT NULL,
	"last_reported" text NOT NULL,
	"state_json" jsonb NOT NULL,
	"unique_id" text NOT NULL,
	CONSTRAINT "synapse_entity_unique_id_unique" UNIQUE("unique_id")
);
--> statement-breakpoint
CREATE TABLE "synapse_entity_locals" (
	"app_unique_id" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"last_modified" timestamp DEFAULT now() NOT NULL,
	"unique_id" text NOT NULL,
	"value_json" jsonb NOT NULL
);
