CREATE TABLE `request_logs` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `app_id` int NOT NULL,
  `action` varchar(50) NOT NULL DEFAULT 'config_fetch',
  `user_id` varchar(255),
  `platform` varchar(50),
  `country` varchar(10),
  `status_code` int NOT NULL DEFAULT 200,
  `created_at` timestamp DEFAULT (now()),
  CONSTRAINT `request_logs_app_id_apps_id_fk` FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`)
);
