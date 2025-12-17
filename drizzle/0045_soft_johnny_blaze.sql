CREATE TABLE `passwordChangeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`changedBy` int NOT NULL,
	`changedByName` varchar(255),
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordChangeHistory_id` PRIMARY KEY(`id`)
);
