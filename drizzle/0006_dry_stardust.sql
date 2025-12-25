CREATE TABLE `pirIntegrityAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`assessmentType` enum('hiring','periodic','promotion','investigation') NOT NULL,
	`status` enum('draft','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`startedAt` datetime,
	`completedAt` datetime,
	`overallScore` int,
	`riskLevel` enum('low','moderate','high','critical'),
	`moralLevel` enum('pre_conventional','conventional','post_conventional'),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityDevelopmentPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`dimensionId` int,
	`actionTitle` varchar(255) NOT NULL,
	`actionDescription` text,
	`targetDate` date,
	`status` enum('pendente','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'pendente',
	`progress` int DEFAULT 0,
	`completedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityDevelopmentPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityDimensionScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`dimensionId` int NOT NULL,
	`score` int NOT NULL,
	`riskLevel` enum('low','moderate','high','critical'),
	`strengths` json,
	`weaknesses` json,
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirIntegrityDimensionScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityDimensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`weight` int NOT NULL DEFAULT 100,
	`displayOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityDimensions_id` PRIMARY KEY(`id`),
	CONSTRAINT `pirIntegrityDimensions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dimensionId` int NOT NULL,
	`questionType` enum('scenario','multiple_choice','scale','open_ended') NOT NULL,
	`title` varchar(255) NOT NULL,
	`scenario` text,
	`question` text NOT NULL,
	`options` json,
	`scaleMin` int,
	`scaleMax` int,
	`scaleLabels` json,
	`requiresJustification` boolean NOT NULL DEFAULT false,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`displayOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`reportType` enum('individual','team','department','executive') NOT NULL,
	`executiveSummary` text,
	`detailedAnalysis` json,
	`recommendations` json,
	`generatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirIntegrityReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedOption` varchar(10),
	`scaleValue` int,
	`openResponse` text,
	`justification` text,
	`timeSpent` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityRiskIndicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`indicatorType` varchar(50) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text,
	`detectedAt` datetime,
	`resolvedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirIntegrityRiskIndicators_id` PRIMARY KEY(`id`)
);
