ALTER TABLE `evaluationCycles` ADD `approvedForGoals` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `evaluationCycles` ADD `approvedForGoalsAt` datetime;--> statement-breakpoint
ALTER TABLE `evaluationCycles` ADD `approvedForGoalsBy` int;