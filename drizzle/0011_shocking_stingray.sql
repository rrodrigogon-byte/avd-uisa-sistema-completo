CREATE TABLE `pirIntegrityQuestionVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`scenario` text,
	`question` text NOT NULL,
	`options` json,
	`questionType` enum('scenario','multiple_choice','scale','open_ended') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`changeReason` text,
	`changeType` enum('created','updated','deactivated','reactivated') NOT NULL,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`previousVersionId` int,
	`isCurrentVersion` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pirIntegrityQuestionVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegritySuspiciousAccessLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`anomalyType` enum('fast_responses','pattern_detected','multiple_sessions','unusual_time','browser_switch','copy_paste','tab_switch','other') NOT NULL,
	`description` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`ipAddress` varchar(45),
	`userAgent` text,
	`metadata` json,
	`status` enum('pending','reviewed','dismissed','confirmed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` datetime,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirIntegritySuspiciousAccessLogs_id` PRIMARY KEY(`id`)
);
