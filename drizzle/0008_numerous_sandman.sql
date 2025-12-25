CREATE TABLE `abTestAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` int NOT NULL,
	`variantId` int NOT NULL,
	`employeeId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`responseTimeSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` datetime,
	CONSTRAINT `abTestAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abTestExperiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetModule` enum('pir','competencias','desempenho','pdi') NOT NULL,
	`status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`trafficPercentage` int NOT NULL DEFAULT 100,
	`startDate` datetime NOT NULL,
	`endDate` datetime,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTestExperiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abTestResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` int NOT NULL,
	`variantId` int NOT NULL,
	`sampleSize` int NOT NULL DEFAULT 0,
	`completions` int NOT NULL DEFAULT 0,
	`conversionRate` int DEFAULT 0,
	`avgResponseTimeSeconds` int,
	`dropoffRate` int DEFAULT 0,
	`isStatisticallySignificant` boolean DEFAULT false,
	`confidenceLevel` int,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `abTestResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abTestVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isControl` boolean NOT NULL DEFAULT false,
	`trafficWeight` int NOT NULL DEFAULT 50,
	`questionContent` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTestVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdVideoRecordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`employeeId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`mimeType` varchar(100) DEFAULT 'video/webm',
	`fileSizeBytes` int,
	`durationSeconds` int,
	`status` enum('uploading','processing','completed','failed') NOT NULL DEFAULT 'uploading',
	`errorMessage` text,
	`transcription` text,
	`analysisResult` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avdVideoRecordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `npsResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`processId` int,
	`score` int NOT NULL,
	`category` enum('promoter','passive','detractor') NOT NULL,
	`followUpComment` text,
	`responseTimeSeconds` int,
	`deviceType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `npsResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `npsSurveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`mainQuestion` text NOT NULL,
	`promoterFollowUp` text,
	`passiveFollowUp` text,
	`detractorFollowUp` text,
	`triggerEvent` enum('process_completed','step_completed','manual') NOT NULL DEFAULT 'process_completed',
	`triggerStepNumber` int,
	`delayMinutes` int DEFAULT 0,
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npsSurveys_id` PRIMARY KEY(`id`)
);
