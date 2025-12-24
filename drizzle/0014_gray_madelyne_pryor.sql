CREATE TABLE `customReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`metrics` json NOT NULL,
	`filters` json,
	`chartType` varchar(50),
	`isTemplate` boolean NOT NULL DEFAULT false,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customReports_id` PRIMARY KEY(`id`)
);
