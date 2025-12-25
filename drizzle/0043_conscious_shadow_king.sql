CREATE TABLE `successionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`candidateId` int,
	`userId` int NOT NULL,
	`actionType` enum('plan_created','plan_updated','plan_deleted','candidate_added','candidate_updated','candidate_removed','risk_updated','timeline_updated','development_updated','test_sent') NOT NULL,
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `successionHistory_id` PRIMARY KEY(`id`)
);
