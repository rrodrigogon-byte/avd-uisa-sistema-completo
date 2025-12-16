CREATE TABLE `pilotMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`recordedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`totalParticipants` int NOT NULL DEFAULT 0,
	`activeParticipants` int NOT NULL DEFAULT 0,
	`completedParticipants` int NOT NULL DEFAULT 0,
	`averageProgress` int NOT NULL DEFAULT 0,
	`averageTimeSpent` int NOT NULL DEFAULT 0,
	`averageScore` int,
	`alertsCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilotMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`employeeId` int NOT NULL,
	`status` enum('invited','accepted','in_training','ready','in_progress','completed','declined','removed') NOT NULL DEFAULT 'invited',
	`trainingCompletedAt` datetime,
	`assessmentStartedAt` datetime,
	`assessmentCompletedAt` datetime,
	`overallScore` int,
	`feedbackNotes` text,
	`invitedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`respondedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`plannedStartDate` datetime NOT NULL,
	`plannedEndDate` datetime NOT NULL,
	`actualStartDate` datetime,
	`actualEndDate` datetime,
	`status` enum('pending','in_progress','completed','delayed','cancelled') NOT NULL DEFAULT 'pending',
	`responsibleUserId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotSchedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotSimulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetParticipants` int NOT NULL DEFAULT 30,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`phase` enum('preparation','training','execution','analysis','adjustment','completed') NOT NULL DEFAULT 'preparation',
	`status` enum('draft','active','paused','completed','cancelled') NOT NULL DEFAULT 'draft',
	`completionRate` int DEFAULT 0,
	`averageScore` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotSimulations_id` PRIMARY KEY(`id`)
);
