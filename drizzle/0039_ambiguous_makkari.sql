ALTER TABLE `successionCandidates` ADD `pdiPlanId` int;--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `pdiProgress` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `pdiCompletedActions` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `pdiTotalActions` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `readinessScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `competencyGapScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `lastScoreUpdate` datetime;