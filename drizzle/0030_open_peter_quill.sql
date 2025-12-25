CREATE TABLE `dataImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`importType` enum('employees','hierarchy','full') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`totalRecords` int DEFAULT 0,
	`successfulRecords` int DEFAULT 0,
	`failedRecords` int DEFAULT 0,
	`skippedRecords` int DEFAULT 0,
	`summary` json,
	`errorLog` text,
	`importedBy` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataImports_id` PRIMARY KEY(`id`)
);
