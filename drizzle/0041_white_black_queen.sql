CREATE TABLE `bonusApprovalComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`calculationId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonusApprovalComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('policy','calculation') NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('created','updated','deleted','approved','rejected','paid') NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonusAuditLogs_id` PRIMARY KEY(`id`)
);
