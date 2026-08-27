ALTER TABLE `users` MODIFY COLUMN `google_id` varchar(255);
ALTER TABLE `users` ADD `password_hash` varchar(255);
ALTER TABLE `users` ADD `invited_by` int;
