CREATE TABLE `behavioralCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`requiredLevel` int NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `behavioralCompetencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobDescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`department` varchar(100),
	`level` varchar(50),
	`summary` text,
	`mission` text,
	`version` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`previousVersionId` int,
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobDescriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `jobDescriptions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `jobRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`type` enum('education','experience','certification','other') NOT NULL,
	`description` text NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `jobRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobResponsibilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`description` text NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `jobResponsibilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`weight` int NOT NULL,
	`targetValue` int,
	`unit` varchar(50),
	`currentValue` int DEFAULT 0,
	`status` enum('not_started','in_progress','completed','blocked') NOT NULL DEFAULT 'not_started',
	`deadline` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`value` int NOT NULL,
	`comments` text,
	`recordedBy` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`period` varchar(100) NOT NULL,
	`status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	`evaluationId` int,
	`managerId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicalCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`requiredLevel` int NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `technicalCompetencies_id` PRIMARY KEY(`id`)
);
