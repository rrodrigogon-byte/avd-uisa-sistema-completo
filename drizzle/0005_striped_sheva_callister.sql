CREATE TABLE `calibrationReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`originalScore` int NOT NULL,
	`calibratedScore` int NOT NULL,
	`reason` text NOT NULL,
	`reviewedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`departmentId` int,
	`facilitatorId` int NOT NULL,
	`status` enum('agendada','em_andamento','concluida') NOT NULL DEFAULT 'agendada',
	`scheduledDate` datetime,
	`startedAt` datetime,
	`completedAt` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationSessions_id` PRIMARY KEY(`id`)
);
