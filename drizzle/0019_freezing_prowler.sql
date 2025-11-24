CREATE TABLE `calibrationApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`movementId` int NOT NULL,
	`approverId` int NOT NULL,
	`approverRole` enum('hr','people_director','area_director') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`evidence` text,
	`comments` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`movedBy` int NOT NULL,
	`fromPerformance` enum('baixo','médio','alto'),
	`fromPotential` enum('baixo','médio','alto'),
	`toPerformance` enum('baixo','médio','alto') NOT NULL,
	`toPotential` enum('baixo','médio','alto') NOT NULL,
	`justification` text NOT NULL,
	`status` enum('pending','approved_hr','approved_people_director','approved_area_director','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationWorkflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`steps` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationWorkflows_id` PRIMARY KEY(`id`)
);
