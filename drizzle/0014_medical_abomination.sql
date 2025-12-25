CREATE TABLE `employeeMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`previousDepartmentId` int,
	`previousPositionId` int,
	`previousManagerId` int,
	`newDepartmentId` int,
	`newPositionId` int,
	`newManagerId` int,
	`movementType` enum('promocao','transferencia','mudanca_gestor','reorganizacao','outro') NOT NULL,
	`reason` text,
	`notes` text,
	`approvedBy` int,
	`approvedAt` datetime,
	`effectiveDate` datetime NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employeeMovements_id` PRIMARY KEY(`id`)
);
