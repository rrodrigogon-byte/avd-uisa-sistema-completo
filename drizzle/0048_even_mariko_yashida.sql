CREATE TABLE `pushNotificationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`actionUrl` varchar(500),
	`deviceType` enum('desktop','mobile','tablet') DEFAULT 'desktop',
	`status` enum('enviada','aberta','erro') NOT NULL DEFAULT 'enviada',
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`openedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushNotificationLogs_id` PRIMARY KEY(`id`)
);
