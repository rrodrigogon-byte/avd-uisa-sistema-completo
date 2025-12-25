CREATE TABLE `feedback360ActionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`competencyId` int NOT NULL,
	`actionDescription` text NOT NULL,
	`targetDate` timestamp,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`progress` int DEFAULT 0,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback360ActionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback360Results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`competencyId` int NOT NULL,
	`selfRating` int,
	`managerRating` int,
	`peerRating` int,
	`subordinateRating` int,
	`overallRating` int,
	`managerCount` int DEFAULT 0,
	`peerCount` int DEFAULT 0,
	`subordinateCount` int DEFAULT 0,
	`selfPeerGap` int,
	`selfManagerGap` int,
	`consolidatedComments` json,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback360Results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `feedback360ActionPlans` ADD CONSTRAINT `feedback360ActionPlans_participantId_feedback360Participants_id_fk` FOREIGN KEY (`participantId`) REFERENCES `feedback360Participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback360Results` ADD CONSTRAINT `feedback360Results_participantId_feedback360Participants_id_fk` FOREIGN KEY (`participantId`) REFERENCES `feedback360Participants`(`id`) ON DELETE no action ON UPDATE no action;