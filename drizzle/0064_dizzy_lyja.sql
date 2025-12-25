ALTER TABLE `smartGoals` MODIFY COLUMN `progress` decimal(5,2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE `smartGoals` MODIFY COLUMN `currentValue` decimal(10,2) NOT NULL DEFAULT '0';