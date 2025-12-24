CREATE TABLE `evaluationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`templateType` enum('360','180','90','custom') NOT NULL DEFAULT 'custom',
	`targetRoles` json,
	`targetDepartments` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('scale_1_5','scale_1_10','text','multiple_choice','yes_no') NOT NULL DEFAULT 'scale_1_5',
	`options` json,
	`weight` int NOT NULL DEFAULT 1,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isRequired` boolean NOT NULL DEFAULT true,
	`helpText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateQuestions_id` PRIMARY KEY(`id`)
);
