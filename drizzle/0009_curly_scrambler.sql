CREATE TABLE `feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('positivo','construtivo','desenvolvimento') NOT NULL,
	`category` varchar(100),
	`content` text NOT NULL,
	`context` text,
	`actionItems` text,
	`linkedPDIId` int,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`acknowledgedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedbacks_id` PRIMARY KEY(`id`)
);
