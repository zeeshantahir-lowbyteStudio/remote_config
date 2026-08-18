ALTER TABLE `config_keys` DROP INDEX `key_per_env_idx`;--> statement-breakpoint
ALTER TABLE `users` ADD `google_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_google_id_unique` UNIQUE(`google_id`);--> statement-breakpoint
ALTER TABLE `apps` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `conditions` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `config_keys` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `environments` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `experiments` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password_hash`;