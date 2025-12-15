CREATE TABLE `reportExecutionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduledReportId` int NOT NULL,
	`executedAt` datetime NOT NULL,
	`status` enum('success','failed','partial') NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`executionTimeMs` int,
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportExecutionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportType` enum('nine_box','performance','pdi','evaluations','goals','competencies','succession','turnover','headcount') NOT NULL,
	`reportName` varchar(255) NOT NULL,
	`frequency` enum('daily','weekly','monthly','quarterly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`hour` int NOT NULL DEFAULT 9,
	`recipients` text NOT NULL,
	`departments` text,
	`format` enum('pdf','excel','csv') NOT NULL DEFAULT 'pdf',
	`includeCharts` boolean NOT NULL DEFAULT true,
	`active` boolean NOT NULL DEFAULT true,
	`lastExecutedAt` datetime,
	`nextExecutionAt` datetime,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledReports_id` PRIMARY KEY(`id`)
);
