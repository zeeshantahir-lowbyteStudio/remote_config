CREATE TABLE `apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`api_key` varchar(100) NOT NULL,
	`environment_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `apps_id` PRIMARY KEY(`id`),
	CONSTRAINT `apps_api_key_unique` UNIQUE(`api_key`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`target` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`rule_expression` varchar(500) NOT NULL,
	`environment_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `conditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `config_key_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key_id` int NOT NULL,
	`condition_id` int NOT NULL,
	`override_value` text NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	CONSTRAINT `config_key_conditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `config_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`type` enum('String','Boolean','Number','JSON') NOT NULL,
	`environment_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `config_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `key_per_env_idx` UNIQUE(`key`,`environment_id`)
);
--> statement-breakpoint
CREATE TABLE `config_values` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key_id` int NOT NULL,
	`draft_value` text,
	`published_value` text,
	`has_draft_change` boolean DEFAULT false,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `config_values_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `environments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `environments_id` PRIMARY KEY(`id`),
	CONSTRAINT `environments_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `experiment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experiment_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`user_identifier` varchar(255) NOT NULL,
	`event_type` enum('assigned','converted') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `experiment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiment_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experiment_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`split_percent` int NOT NULL,
	CONSTRAINT `experiment_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`config_key_id` int NOT NULL,
	`status` enum('draft','running','paused','completed') NOT NULL DEFAULT 'draft',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publish_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`environment_id` int NOT NULL,
	`version` int NOT NULL,
	`published_by` int NOT NULL,
	`summary` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `publish_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('viewer','editor','publisher') NOT NULL DEFAULT 'viewer',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `apps` ADD CONSTRAINT `apps_environment_id_environments_id_fk` FOREIGN KEY (`environment_id`) REFERENCES `environments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conditions` ADD CONSTRAINT `conditions_environment_id_environments_id_fk` FOREIGN KEY (`environment_id`) REFERENCES `environments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `config_key_conditions` ADD CONSTRAINT `config_key_conditions_config_key_id_config_keys_id_fk` FOREIGN KEY (`config_key_id`) REFERENCES `config_keys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `config_key_conditions` ADD CONSTRAINT `config_key_conditions_condition_id_conditions_id_fk` FOREIGN KEY (`condition_id`) REFERENCES `conditions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `config_keys` ADD CONSTRAINT `config_keys_environment_id_environments_id_fk` FOREIGN KEY (`environment_id`) REFERENCES `environments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `config_values` ADD CONSTRAINT `config_values_config_key_id_config_keys_id_fk` FOREIGN KEY (`config_key_id`) REFERENCES `config_keys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiment_events` ADD CONSTRAINT `experiment_events_experiment_id_experiments_id_fk` FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiment_events` ADD CONSTRAINT `experiment_events_variant_id_experiment_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `experiment_variants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiment_variants` ADD CONSTRAINT `experiment_variants_experiment_id_experiments_id_fk` FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiments` ADD CONSTRAINT `experiments_config_key_id_config_keys_id_fk` FOREIGN KEY (`config_key_id`) REFERENCES `config_keys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publish_history` ADD CONSTRAINT `publish_history_environment_id_environments_id_fk` FOREIGN KEY (`environment_id`) REFERENCES `environments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publish_history` ADD CONSTRAINT `publish_history_published_by_users_id_fk` FOREIGN KEY (`published_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;