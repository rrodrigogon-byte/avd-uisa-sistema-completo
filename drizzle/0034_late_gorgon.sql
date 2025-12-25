CREATE TABLE `feedback360Cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`status` enum('draft','active','closed','archived') NOT NULL DEFAULT 'draft',
	`allowSelfAssessment` boolean NOT NULL DEFAULT true,
	`minEvaluators` int NOT NULL DEFAULT 3,
	`maxEvaluators` int NOT NULL DEFAULT 10,
	`anonymousResponses` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback360Cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback360Evaluators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`relationshipType` enum('self','manager','peer','subordinate','other') NOT NULL,
	`status` enum('pending','in_progress','completed','declined') NOT NULL DEFAULT 'pending',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback360Evaluators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback360Participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`status` enum('invited','in_progress','completed','skipped') NOT NULL DEFAULT 'invited',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback360Participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback360Questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`question` text NOT NULL,
	`description` text,
	`responseType` enum('scale','text','multiple_choice') NOT NULL DEFAULT 'scale',
	`scaleMin` int DEFAULT 1,
	`scaleMax` int DEFAULT 5,
	`options` json,
	`required` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback360Questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback360Reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`totalEvaluators` int NOT NULL,
	`completedEvaluations` int NOT NULL,
	`averageScore` int,
	`categoryScores` json,
	`scoresByRelationship` json,
	`strengths` json,
	`improvementAreas` json,
	`comments` json,
	`status` enum('generating','completed','error') NOT NULL DEFAULT 'generating',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`generatedBy` int,
	CONSTRAINT `feedback360Reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback360Responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluatorRecordId` int NOT NULL,
	`questionId` int NOT NULL,
	`scaleValue` int,
	`textValue` text,
	`selectedOption` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback360Responses_id` PRIMARY KEY(`id`)
);
