CREATE TABLE `hierarchyImportLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`totalRecords` int NOT NULL,
	`importedRecords` int NOT NULL,
	`updatedRecords` int NOT NULL,
	`errorRecords` int NOT NULL DEFAULT 0,
	`errors` json,
	`importedBy` int,
	`importedByName` varchar(255),
	`status` enum('em_andamento','concluido','erro') NOT NULL DEFAULT 'em_andamento',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `hierarchyImportLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizationalPositions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationalPositions_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizationalPositions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `organizationalSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(100),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationalSections_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizationalSections_code_unique` UNIQUE(`code`)
);
