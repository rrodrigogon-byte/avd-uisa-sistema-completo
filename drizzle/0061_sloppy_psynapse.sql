CREATE TABLE `criticalGoalAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`userId` int NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`message` text NOT NULL,
	`isRead` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `criticalGoalAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportExecutionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`status` enum('success','failed','pending') NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`fileUrl` varchar(500),
	`errorMessage` text,
	CONSTRAINT `reportExecutionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`reportType` enum('goals','alerts','performance','summary') NOT NULL,
	`format` enum('pdf','excel','csv') NOT NULL,
	`frequency` enum('daily','weekly','monthly') NOT NULL,
	`recipients` text,
	`lastExecuted` timestamp,
	`nextExecution` timestamp,
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('financial','operational','behavioral','development') NOT NULL,
	`targetValue` decimal(10,2),
	`currentValue` decimal(10,2) DEFAULT '0',
	`progress` decimal(5,2) DEFAULT '0',
	`status` enum('not_started','in_progress','completed','delayed') DEFAULT 'not_started',
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smartGoals_id` PRIMARY KEY(`id`)
);
