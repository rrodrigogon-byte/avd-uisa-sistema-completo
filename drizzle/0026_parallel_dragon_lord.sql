CREATE TABLE `pdiActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`axis` enum('70_pratica','20_experiencia','10_educacao') NOT NULL,
	`developmentArea` varchar(100) NOT NULL,
	`successMetric` text NOT NULL,
	`evidenceRequired` text,
	`responsible` varchar(255) NOT NULL,
	`dueDate` datetime NOT NULL,
	`status` enum('nao_iniciado','em_andamento','concluido') NOT NULL DEFAULT 'nao_iniciado',
	`progress` int NOT NULL DEFAULT 0,
	`completedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiGovernanceReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`reviewDate` datetime NOT NULL,
	`reviewerId` int NOT NULL,
	`reviewerRole` enum('dgc','mentor','sponsor') NOT NULL,
	`readinessIndex` decimal(3,1) NOT NULL,
	`keyPoints` text NOT NULL,
	`strengths` text,
	`improvements` text,
	`nextSteps` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdiGovernanceReviews_id` PRIMARY KEY(`id`)
);
