ALTER TABLE `performanceEvaluations` ADD `workflowStatus` enum('pending_self','pending_manager','pending_consensus','completed') DEFAULT 'pending_self' NOT NULL;--> statement-breakpoint
ALTER TABLE `performanceEvaluations` ADD `selfCompletedAt` datetime;--> statement-breakpoint
ALTER TABLE `performanceEvaluations` ADD `managerCompletedAt` datetime;--> statement-breakpoint
ALTER TABLE `performanceEvaluations` ADD `consensusCompletedAt` datetime;