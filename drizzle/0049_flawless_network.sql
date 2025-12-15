CREATE TABLE `calibrationComparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`selfScore` int,
	`managerScore` int,
	`peerScores` json,
	`consensusScore` int,
	`consensusReachedAt` datetime,
	`consensusBy` int,
	`hasDiscrepancy` boolean NOT NULL DEFAULT false,
	`discrepancyReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationComparisons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('facilitator','participant','observer') NOT NULL DEFAULT 'participant',
	`joinedAt` datetime,
	`leftAt` datetime,
	`isOnline` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`voterId` int NOT NULL,
	`proposedScore` int NOT NULL,
	`justification` text,
	`voteType` enum('approve','reject','abstain') NOT NULL DEFAULT 'approve',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationVotes_id` PRIMARY KEY(`id`)
);
