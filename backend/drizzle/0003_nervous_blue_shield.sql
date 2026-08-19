CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `environments` DROP INDEX `environments_name_unique`;--> statement-breakpoint
ALTER TABLE `environments` ADD `project_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `environments` ADD CONSTRAINT `env_name_project_idx` UNIQUE(`name`,`project_id`);--> statement-breakpoint
ALTER TABLE `environments` ADD CONSTRAINT `environments_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;