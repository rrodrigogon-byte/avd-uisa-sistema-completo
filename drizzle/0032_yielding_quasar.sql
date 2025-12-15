CREATE TABLE `pulseSurveyResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`employeeId` int,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `pulseSurveyResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pulseSurveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`description` text,
	`status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
	`targetDepartmentId` int,
	`targetEmployeeIds` json,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`activatedAt` datetime,
	`closedAt` datetime,
	CONSTRAINT `pulseSurveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `goalApprovals` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `goalApprovals` DROP COLUMN `decidedAt`;--> statement-breakpoint
ALTER TABLE `goalComments` DROP COLUMN `updatedAt`;