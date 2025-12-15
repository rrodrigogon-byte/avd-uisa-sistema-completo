CREATE TABLE `pulseSurveyEmailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastAttemptAt` datetime,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` datetime,
	CONSTRAINT `pulseSurveyEmailLogs_id` PRIMARY KEY(`id`)
);
