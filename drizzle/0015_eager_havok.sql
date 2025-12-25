CREATE TABLE `orgChartStructure` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeType` enum('department','position') NOT NULL,
	`departmentId` int,
	`positionId` int,
	`parentId` int,
	`level` int NOT NULL DEFAULT 0,
	`orderIndex` int NOT NULL DEFAULT 0,
	`displayName` varchar(255) NOT NULL,
	`color` varchar(20),
	`icon` varchar(50),
	`positionX` int,
	`positionY` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orgChartStructure_id` PRIMARY KEY(`id`)
);
