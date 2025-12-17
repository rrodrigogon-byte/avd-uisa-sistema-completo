CREATE TABLE `abLayoutConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` int NOT NULL,
	`variantId` int NOT NULL,
	`layoutType` enum('control','cards','grid','wizard','minimal') NOT NULL,
	`colorScheme` varchar(50),
	`fontFamily` varchar(100),
	`spacing` enum('compact','normal','relaxed') DEFAULT 'normal',
	`showProgressBar` boolean DEFAULT true,
	`showStepNumbers` boolean DEFAULT true,
	`showHelpTooltips` boolean DEFAULT false,
	`animationsEnabled` boolean DEFAULT true,
	`customCss` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abLayoutConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abTestMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` int NOT NULL,
	`variantId` int NOT NULL,
	`userId` int NOT NULL,
	`metricType` enum('page_view','time_on_page','step_completion','form_submission','error_count','satisfaction_rating','task_completion_time') NOT NULL,
	`metricValue` int,
	`metricLabel` varchar(100),
	`pageUrl` varchar(500),
	`stepNumber` int,
	`sessionId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `abTestMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidatedReportCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`departmentId` int,
	`positionId` int,
	`npsData` json,
	`performanceData` json,
	`correlationData` json,
	`departmentBreakdown` json,
	`trends` json,
	`integrityAlerts` json,
	`riskIndicators` json,
	`generatedBy` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` datetime NOT NULL,
	CONSTRAINT `consolidatedReportCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `npsDetractorAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseId` int NOT NULL,
	`employeeId` int NOT NULL,
	`surveyId` int NOT NULL,
	`score` int NOT NULL,
	`comment` text,
	`status` enum('new','acknowledged','in_progress','resolved','dismissed') NOT NULL DEFAULT 'new',
	`acknowledgedBy` int,
	`acknowledgedAt` datetime,
	`resolvedBy` int,
	`resolvedAt` datetime,
	`resolutionNotes` text,
	`notificationSentAt` datetime,
	`notificationRecipients` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npsDetractorAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `npsScheduledTriggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`processId` int NOT NULL,
	`scheduledFor` datetime NOT NULL,
	`delayMinutes` int DEFAULT 0,
	`status` enum('pending','sent','responded','expired','cancelled') NOT NULL DEFAULT 'pending',
	`sentAt` datetime,
	`respondedAt` datetime,
	`responseId` int,
	`triggerReason` varchar(100) DEFAULT 'pdi_completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npsScheduledTriggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `npsSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`autoTriggerEnabled` boolean DEFAULT true,
	`defaultDelayMinutes` int DEFAULT 1440,
	`reminderEnabled` boolean DEFAULT true,
	`reminderDelayMinutes` int DEFAULT 4320,
	`maxReminders` int DEFAULT 2,
	`detractorAlertEnabled` boolean DEFAULT true,
	`detractorThreshold` int DEFAULT 6,
	`alertRecipientEmails` text,
	`surveyExpirationDays` int DEFAULT 7,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npsSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`employeeId` int NOT NULL,
	`alertType` enum('missing_dimensions','inconsistent_scores','incomplete_assessment','outlier_detected','data_mismatch') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`description` text NOT NULL,
	`affectedFields` text,
	`expectedValue` varchar(255),
	`actualValue` varchar(255),
	`status` enum('open','investigating','resolved','false_positive') NOT NULL DEFAULT 'open',
	`resolvedBy` int,
	`resolvedAt` datetime,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportExportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportType` enum('nps_consolidated','performance_summary','department_analysis','trend_analysis','integrity_report') NOT NULL,
	`exportFormat` enum('csv','json','pdf','xlsx') NOT NULL,
	`filters` json,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`fileUrl` varchar(500),
	`exportedBy` int NOT NULL,
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` datetime,
	CONSTRAINT `reportExportHistory_id` PRIMARY KEY(`id`)
);
