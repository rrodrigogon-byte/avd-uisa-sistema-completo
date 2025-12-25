ALTER TABLE `successionPlans` ADD `exitRisk` enum('baixo','medio','alto') DEFAULT 'medio';--> statement-breakpoint
ALTER TABLE `successionPlans` ADD `competencyGap` text;--> statement-breakpoint
ALTER TABLE `successionPlans` ADD `preparationTime` int;--> statement-breakpoint
ALTER TABLE `successionPlans` ADD `trackingPlan` text;--> statement-breakpoint
ALTER TABLE `successionPlans` ADD `nextReviewDate` timestamp;