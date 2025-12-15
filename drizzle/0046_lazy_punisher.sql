CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`p256dh` varchar(200) NOT NULL,
	`auth` varchar(100) NOT NULL,
	`userAgent` varchar(500),
	`deviceType` enum('desktop','mobile','tablet') DEFAULT 'desktop',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `evaluationCycles` MODIFY COLUMN `status` enum('planejado','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'planejado';--> statement-breakpoint
ALTER TABLE `evaluationCycles` ADD `active` boolean DEFAULT true NOT NULL;