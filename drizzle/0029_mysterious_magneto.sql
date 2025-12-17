ALTER TABLE `goals` ADD `parentGoalId` int;--> statement-breakpoint
ALTER TABLE `goals` ADD `departmentId` int;--> statement-breakpoint
ALTER TABLE `goals` ADD `alignmentPercentage` int DEFAULT 0;