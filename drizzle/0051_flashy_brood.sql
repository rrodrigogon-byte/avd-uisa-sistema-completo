ALTER TABLE `calibrationSessions` MODIFY COLUMN `cycleId` int;--> statement-breakpoint
ALTER TABLE `calibrationSessions` MODIFY COLUMN `facilitatorId` int;--> statement-breakpoint
ALTER TABLE `calibrationSessions` MODIFY COLUMN `status` enum('draft','in_progress','completed','agendada','em_andamento','concluida') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `calibrationSessions` ADD `sessionName` varchar(255);--> statement-breakpoint
ALTER TABLE `calibrationSessions` ADD `departmentFilter` text;--> statement-breakpoint
ALTER TABLE `calibrationSessions` ADD `levelFilter` text;--> statement-breakpoint
ALTER TABLE `calibrationSessions` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `calibrationSessions` ADD `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;