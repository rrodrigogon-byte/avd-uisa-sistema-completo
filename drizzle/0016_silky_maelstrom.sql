CREATE TABLE `pdiCompetencyGaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`competencyId` int NOT NULL,
	`currentLevel` int NOT NULL,
	`targetLevel` int NOT NULL,
	`gap` int NOT NULL,
	`priority` enum('alta','media','baixa') NOT NULL DEFAULT 'media',
	`employeeActions` text,
	`managerActions` text,
	`sponsorActions` text,
	`status` enum('identificado','em_desenvolvimento','superado') NOT NULL DEFAULT 'identificado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiCompetencyGaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiIntelligentDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`strategicContext` text,
	`durationMonths` int NOT NULL DEFAULT 24,
	`mentorId` int,
	`sponsorId1` int,
	`sponsorId2` int,
	`guardianId` int,
	`currentProfile` json,
	`targetProfile` json,
	`gapsAnalysis` json,
	`milestone12Months` text,
	`milestone24Months` text,
	`milestone12Status` enum('pendente','concluido','atrasado') DEFAULT 'pendente',
	`milestone24Status` enum('pendente','concluido','atrasado') DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiIntelligentDetails_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiIntelligentDetails_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`reviewerRole` enum('mentor','sponsor','guardiao') NOT NULL,
	`reviewDate` datetime NOT NULL,
	`overallProgress` int NOT NULL,
	`strengths` text,
	`improvements` text,
	`nextSteps` text,
	`recommendation` enum('manter','acelerar','ajustar','pausar') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdiReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiRisks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`type` enum('saida','gap_competencia','tempo_preparo','mudanca_estrategica','outro') NOT NULL,
	`description` text NOT NULL,
	`impact` enum('baixo','medio','alto','critico') NOT NULL,
	`probability` enum('baixa','media','alta') NOT NULL,
	`mitigation` text,
	`responsible` int,
	`status` enum('identificado','em_mitigacao','mitigado','materializado') NOT NULL DEFAULT 'identificado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiRisks_id` PRIMARY KEY(`id`)
);
