CREATE TABLE `performanceEvaluationApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`approverType` enum('gestor','rh','diretoria') NOT NULL,
	`approverId` int NOT NULL,
	`action` enum('aprovado','rejeitado','solicitado_ajuste') NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceEvaluationApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceEvaluationCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`year` int NOT NULL,
	`period` enum('anual','semestral','trimestral') NOT NULL DEFAULT 'anual',
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`adhesionDeadline` date NOT NULL,
	`managerApprovalDeadline` date NOT NULL,
	`trackingStartDate` date,
	`trackingEndDate` date,
	`evaluationDeadline` date,
	`corporateGoalIds` text,
	`status` enum('planejado','aberto','em_andamento','em_avaliacao','concluido','cancelado') NOT NULL DEFAULT 'planejado',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceEvaluationCycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceEvaluationEvidences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`goalType` enum('corporativa','individual') NOT NULL,
	`goalIndex` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`evidenceType` enum('documento','link','imagem','video','texto') NOT NULL,
	`fileUrl` varchar(512),
	`linkUrl` varchar(512),
	`progressPercentage` int DEFAULT 0,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceEvaluationEvidences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceEvaluationParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`managerId` int,
	`individualGoals` text,
	`status` enum('pendente_adesao','aguardando_aprovacao_gestor','metas_aprovadas','em_acompanhamento','aguardando_avaliacao','avaliacao_concluida','aprovado_rh') NOT NULL DEFAULT 'pendente_adesao',
	`adhesionDate` datetime,
	`managerApprovalDate` datetime,
	`evaluationDate` datetime,
	`finalApprovalDate` datetime,
	`managerRejectionReason` text,
	`managerComments` text,
	`selfEvaluationScore` int,
	`managerEvaluationScore` int,
	`finalScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceEvaluationParticipants_id` PRIMARY KEY(`id`)
);
