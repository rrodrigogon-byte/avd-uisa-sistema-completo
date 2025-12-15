CREATE TABLE `jobDescriptionApprovalHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`action` enum('submetido','aprovado','rejeitado','reaberto','arquivado') NOT NULL,
	`performedBy` int NOT NULL,
	`comments` text,
	`previousStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobDescriptionApprovalHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirApprovalHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirId` int NOT NULL,
	`action` enum('submetido','aprovado','rejeitado','reaberto') NOT NULL,
	`performedBy` int NOT NULL,
	`comments` text,
	`previousStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirApprovalHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `jobDescriptions` MODIFY COLUMN `isActive` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `pirs` MODIFY COLUMN `status` enum('rascunho','em_analise','aprovado','rejeitado','ativo','concluido','cancelado') NOT NULL DEFAULT 'rascunho';--> statement-breakpoint
ALTER TABLE `jobDescriptions` ADD `status` enum('rascunho','em_analise','aprovado','rejeitado','arquivado') DEFAULT 'rascunho' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobDescriptions` ADD `rejectedBy` int;--> statement-breakpoint
ALTER TABLE `jobDescriptions` ADD `rejectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `jobDescriptions` ADD `approvalComments` text;--> statement-breakpoint
ALTER TABLE `jobDescriptions` ADD `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `pirs` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `pirs` ADD `rejectedBy` int;--> statement-breakpoint
ALTER TABLE `pirs` ADD `rejectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `pirs` ADD `approvalComments` text;--> statement-breakpoint
ALTER TABLE `pirs` ADD `submittedAt` timestamp;