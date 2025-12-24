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
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`parentDepartmentId` int,
	`managerId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_name_unique` UNIQUE(`name`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`employeeId` varchar(50) NOT NULL,
	`departmentId` int NOT NULL,
	`positionId` int NOT NULL,
	`supervisorId` int,
	`hireDate` timestamp NOT NULL,
	`terminationDate` timestamp,
	`status` enum('active','on_leave','terminated') NOT NULL DEFAULT 'active',
	`phone` varchar(20),
	`location` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`),
	CONSTRAINT `employees_employeeId_unique` UNIQUE(`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `evaluationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`structure` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`evaluatedUserId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`period` varchar(100) NOT NULL,
	`status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`responses` text NOT NULL,
	`comments` text,
	`score` int,
	`submittedAt` timestamp,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
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
CREATE TABLE `notificationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('new_evaluation','reminder','status_change','deadline_approaching') NOT NULL,
	`evaluationId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notifyOnNewEvaluation` boolean NOT NULL DEFAULT true,
	`notifyPendingReminders` boolean NOT NULL DEFAULT true,
	`notifyOnStatusChange` boolean NOT NULL DEFAULT true,
	`reminderDaysBefore` int NOT NULL DEFAULT 7,
	`reminderFrequency` enum('daily','weekly') NOT NULL DEFAULT 'weekly',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationSettings_userId_unique` UNIQUE(`userId`)
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
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`level` int NOT NULL,
	`description` text,
	`jobDescriptionId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `positions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('performance_overview','team_comparison','individual_progress','custom') NOT NULL,
	`period` varchar(100) NOT NULL,
	`data` text NOT NULL,
	`generatedBy` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
