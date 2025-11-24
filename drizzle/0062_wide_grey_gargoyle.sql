CREATE TABLE `goalMonitoringLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`goalsProcessed` int DEFAULT 0,
	`alertsGenerated` int DEFAULT 0,
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	CONSTRAINT `goalMonitoringLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `smartGoals`;--> statement-breakpoint
ALTER TABLE `criticalGoalAlerts` ADD `goalTitle` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `criticalGoalAlerts` ADD `currentProgress` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `criticalGoalAlerts` ADD `actionTaken` varchar(100);--> statement-breakpoint
ALTER TABLE `criticalGoalAlerts` ADD `resolvedAt` timestamp;