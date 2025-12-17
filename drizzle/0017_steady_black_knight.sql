CREATE TABLE `goalApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`approverId` int NOT NULL,
	`approverRole` enum('manager','hr','director') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	CONSTRAINT `goalApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`authorId` int NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goalComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` date NOT NULL,
	`status` enum('pending','in_progress','completed','delayed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `goalMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`cycleId` int NOT NULL,
	`pdiPlanId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`type` enum('individual','team','organizational') NOT NULL,
	`category` enum('financial','behavioral','corporate','development') NOT NULL,
	`isSpecific` boolean NOT NULL DEFAULT false,
	`isMeasurable` boolean NOT NULL DEFAULT false,
	`isAchievable` boolean NOT NULL DEFAULT false,
	`isRelevant` boolean NOT NULL DEFAULT false,
	`isTimeBound` boolean NOT NULL DEFAULT false,
	`measurementUnit` varchar(50),
	`targetValue` decimal(10,2),
	`currentValue` decimal(10,2) DEFAULT '0',
	`weight` int NOT NULL DEFAULT 10,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`bonusEligible` boolean NOT NULL DEFAULT false,
	`bonusPercentage` decimal(5,2),
	`bonusAmount` decimal(10,2),
	`status` enum('draft','pending_approval','approved','rejected','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`approvalStatus` enum('not_submitted','pending_manager','pending_hr','approved','rejected') NOT NULL DEFAULT 'not_submitted',
	`progress` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `smartGoals_id` PRIMARY KEY(`id`)
);
