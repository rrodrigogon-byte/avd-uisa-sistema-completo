CREATE TABLE `reportAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int,
	`reportName` varchar(255),
	`action` enum('view','export_pdf','export_excel','create','update','delete') NOT NULL,
	`userId` int NOT NULL,
	`metrics` json,
	`filters` json,
	`executionTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportAnalytics_id` PRIMARY KEY(`id`)
);
