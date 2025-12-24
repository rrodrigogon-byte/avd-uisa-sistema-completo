CREATE TABLE `pdiActionPlan702010` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`practice70Title` varchar(255) NOT NULL DEFAULT '70% - Aprendizado na Prática (On-the-Job)',
	`practice70Items` json DEFAULT ('[]'),
	`social20Title` varchar(255) NOT NULL DEFAULT '20% - Aprendizado com Outros (Social)',
	`social20Items` json DEFAULT ('[]'),
	`formal10Title` varchar(255) NOT NULL DEFAULT '10% - Aprendizado Formal',
	`formal10Items` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiActionPlan702010_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiActionPlan702010_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiKpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`currentPosition` varchar(100),
	`reframing` varchar(100),
	`newPosition` varchar(100),
	`performancePlanMonths` int DEFAULT 24,
	`technicalExcellence` varchar(100),
	`leadership` varchar(100),
	`immediateIncentive` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiKpis_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiKpis_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiRemunerationMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategyId` int NOT NULL,
	`level` varchar(100) NOT NULL,
	`deadline` varchar(100),
	`trigger` text,
	`mechanism` varchar(255),
	`projectedSalary` varchar(100),
	`positionInRange` varchar(100),
	`justification` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiRemunerationMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiRemunerationStrategy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`midpoint` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiRemunerationStrategy_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiRemunerationStrategy_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiResponsibilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`employeeTitle` varchar(255) NOT NULL DEFAULT 'Responsabilidades do Protagonista',
	`employeeResponsibilities` json DEFAULT ('[]'),
	`leadershipTitle` varchar(255) NOT NULL DEFAULT 'Responsabilidades da Liderança',
	`leadershipResponsibilities` json DEFAULT ('[]'),
	`dhoTitle` varchar(255) NOT NULL DEFAULT 'Responsabilidades do DHO (O Guardião)',
	`dhoResponsibilities` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiResponsibilities_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiResponsibilities_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`employeeName` varchar(255),
	`employeeSignedAt` datetime,
	`employeeSignature` varchar(512),
	`sponsorName` varchar(255),
	`sponsorSignedAt` datetime,
	`sponsorSignature` varchar(512),
	`mentorName` varchar(255),
	`mentorSignedAt` datetime,
	`mentorSignature` varchar(512),
	`dhoName` varchar(255),
	`dhoSignedAt` datetime,
	`dhoSignature` varchar(512),
	`allSigned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiSignatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiSignatures_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiTimeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`targetDate` datetime NOT NULL,
	`completedDate` datetime,
	`status` enum('pendente','em_andamento','concluido','atrasado') NOT NULL DEFAULT 'pendente',
	`progress` int NOT NULL DEFAULT 0,
	`notes` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiTimeline_id` PRIMARY KEY(`id`)
);
