CREATE TABLE `alertRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`alertType` enum('multiple_failed_logins','unusual_activity_volume','suspicious_time_access','data_export_anomaly','privilege_escalation','unusual_entity_access') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`threshold` int NOT NULL,
	`timeWindow` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`notifyAdmins` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertType` enum('multiple_failed_logins','unusual_activity_volume','suspicious_time_access','data_export_anomaly','privilege_escalation','unusual_entity_access') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`userId` int,
	`description` text NOT NULL,
	`details` text,
	`status` enum('new','investigating','resolved','false_positive') NOT NULL DEFAULT 'new',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditAlerts_id` PRIMARY KEY(`id`)
);
