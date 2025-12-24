ALTER TABLE `employees` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `smartGoals` ADD `goalType` enum('individual','corporate') DEFAULT 'individual' NOT NULL;