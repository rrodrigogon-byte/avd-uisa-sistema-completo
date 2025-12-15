CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('low_productivity','inconsistent_hours','low_diversity','missing_activities','time_discrepancy','goal_overdue','evaluation_pending') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`metrics` text,
	`status` enum('active','resolved','dismissed') NOT NULL DEFAULT 'active',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	`actionTaken` enum('email_sent','meeting_scheduled','warning_issued','training_assigned','none'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeClockRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` timestamp NOT NULL,
	`clockIn` timestamp,
	`clockOut` timestamp,
	`totalMinutes` int,
	`breakMinutes` int DEFAULT 0,
	`workedMinutes` int,
	`recordType` enum('normal','overtime','absence','late','early_leave','holiday') NOT NULL DEFAULT 'normal',
	`location` varchar(255),
	`notes` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`importSource` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeClockRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeDiscrepancies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` timestamp NOT NULL,
	`clockMinutes` int NOT NULL,
	`activityMinutes` int NOT NULL,
	`differenceMinutes` int NOT NULL,
	`differencePercentage` decimal(5,2),
	`discrepancyType` enum('over_reported','under_reported','acceptable') NOT NULL,
	`status` enum('pending','reviewed','justified','flagged') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`justification` text,
	`alertId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeDiscrepancies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_resolvedBy_employees_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeClockRecords` ADD CONSTRAINT `timeClockRecords_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeDiscrepancies` ADD CONSTRAINT `timeDiscrepancies_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeDiscrepancies` ADD CONSTRAINT `timeDiscrepancies_reviewedBy_employees_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeDiscrepancies` ADD CONSTRAINT `timeDiscrepancies_alertId_alerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `alerts`(`id`) ON DELETE no action ON UPDATE no action;