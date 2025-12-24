CREATE TABLE `notificationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`eventType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`sendEmail` enum('yes','no') NOT NULL DEFAULT 'no',
	`sendPush` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationTemplates_id` PRIMARY KEY(`id`)
);
