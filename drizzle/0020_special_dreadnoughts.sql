ALTER TABLE `employees` ADD `gamificationPoints` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `gamificationLevel` varchar(20) DEFAULT 'Bronze' NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `lastPointsUpdate` timestamp DEFAULT (now());