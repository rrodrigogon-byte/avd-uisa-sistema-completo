CREATE TABLE `evaluation360CycleCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`competencyId` int NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`minLevel` int NOT NULL DEFAULT 1,
	`maxLevel` int NOT NULL DEFAULT 5,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleCompetencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation360CycleConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`tempData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation360CycleParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`participationType` enum('evaluated','evaluator','both') NOT NULL DEFAULT 'evaluated',
	`managerId` int,
	`peerIds` text,
	`subordinateIds` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation360CycleWeights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`selfWeight` int NOT NULL DEFAULT 25,
	`managerWeight` int NOT NULL DEFAULT 25,
	`peersWeight` int NOT NULL DEFAULT 25,
	`subordinatesWeight` int NOT NULL DEFAULT 25,
	`selfEvaluationDeadline` datetime,
	`managerEvaluationDeadline` datetime,
	`peersEvaluationDeadline` datetime,
	`subordinatesEvaluationDeadline` datetime,
	`consensusDeadline` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleWeights_id` PRIMARY KEY(`id`)
);
