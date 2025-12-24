CREATE TABLE `emailConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('smtp','sendgrid','aws_ses') NOT NULL,
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUser` varchar(255),
	`smtpPassword` varchar(255),
	`sendgridApiKey` varchar(255),
	`awsAccessKey` varchar(255),
	`awsSecretKey` varchar(255),
	`fromEmail` varchar(255) NOT NULL,
	`fromName` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`performanceScore` decimal(5,2) DEFAULT '0',
	`goalsCompleted` int DEFAULT 0,
	`goalsTotal` int DEFAULT 0,
	`alertsGenerated` int DEFAULT 0,
	`criticalGoals` int DEFAULT 0,
	`recordedAt` timestamp DEFAULT (now()),
	CONSTRAINT `performanceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('financial','behavioral','corporate','development') NOT NULL,
	`status` enum('planejada','em_andamento','concluida','cancelada') DEFAULT 'planejada',
	`progress` decimal(5,2) DEFAULT '0',
	`targetValue` decimal(10,2),
	`currentValue` decimal(10,2) DEFAULT '0',
	`unit` varchar(50),
	`weight` int DEFAULT 1,
	`startDate` timestamp DEFAULT (now()),
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smartGoals_id` PRIMARY KEY(`id`)
);
