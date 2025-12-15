CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` int,
	`changes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('tecnica','comportamental','lideranca') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `competencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `competencyLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencyId` int NOT NULL,
	`level` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competencyLevels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parentId` int,
	`managerId` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `developmentActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('70_pratica','20_mentoria','10_curso') NOT NULL,
	`type` varchar(100),
	`competencyId` int,
	`duration` int,
	`provider` varchar(255),
	`url` varchar(512),
	`cost` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developmentActions_id` PRIMARY KEY(`id`),
	CONSTRAINT `developmentActions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `emailMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(100) NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`subject` varchar(255),
	`success` boolean NOT NULL,
	`deliveryTime` int,
	`messageId` varchar(255),
	`error` text,
	`attempts` int NOT NULL DEFAULT 1,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`competencyId` int NOT NULL,
	`currentLevel` int NOT NULL,
	`evaluatedAt` datetime NOT NULL,
	`evaluatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeCompetencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`employeeCode` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`cpf` varchar(14),
	`birthDate` datetime,
	`hireDate` datetime NOT NULL,
	`departmentId` int NOT NULL,
	`positionId` int NOT NULL,
	`managerId` int,
	`photoUrl` varchar(512),
	`phone` varchar(20),
	`address` text,
	`status` enum('ativo','afastado','desligado') NOT NULL DEFAULT 'ativo',
	`rmCode` varchar(50),
	`rmLastSync` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `employees_employeeCode_unique` UNIQUE(`employeeCode`),
	CONSTRAINT `employees_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `evaluationCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`type` enum('anual','semestral','trimestral') NOT NULL,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`status` enum('planejamento','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'planejamento',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationCycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`question` text NOT NULL,
	`category` varchar(100),
	`type` enum('escala','texto','multipla_escolha') NOT NULL,
	`options` text,
	`weight` int NOT NULL DEFAULT 1,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationQuestions_id` PRIMARY KEY(`id`),
	CONSTRAINT `evaluationQuestions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `evaluationResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`questionId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluatorType` enum('self','manager','peer','subordinate') NOT NULL,
	`score` int,
	`textResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`progress` int NOT NULL,
	`currentValue` varchar(100),
	`notes` text,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('individual','equipe','organizacional') NOT NULL,
	`category` enum('quantitativa','qualitativa') NOT NULL,
	`targetValue` varchar(100),
	`currentValue` varchar(100),
	`unit` varchar(50),
	`weight` int NOT NULL DEFAULT 1,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`status` enum('rascunho','pendente_aprovacao','aprovada','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'rascunho',
	`progress` int NOT NULL DEFAULT 0,
	`linkedToPLR` boolean NOT NULL DEFAULT false,
	`linkedToBonus` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nineBoxPositions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`performance` int NOT NULL,
	`potential` int NOT NULL,
	`box` varchar(50) NOT NULL,
	`calibrated` boolean NOT NULL DEFAULT false,
	`calibratedBy` int,
	`calibratedAt` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nineBoxPositions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`link` varchar(512),
	`read` boolean NOT NULL DEFAULT false,
	`readAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`actionId` int,
	`competencyId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('70_pratica','20_mentoria','10_curso') NOT NULL,
	`type` varchar(100),
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`status` enum('pendente','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'pendente',
	`progress` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `pdiItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`targetPositionId` int,
	`status` enum('rascunho','pendente_aprovacao','aprovado','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'rascunho',
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`overallProgress` int NOT NULL DEFAULT 0,
	`approvedBy` int,
	`approvedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `pdiPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`progress` int NOT NULL,
	`notes` text,
	`evidenceUrl` varchar(512),
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdiProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('360','180','90') NOT NULL,
	`status` enum('pendente','em_andamento','concluida') NOT NULL DEFAULT 'pendente',
	`selfEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`managerEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`peersEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`subordinatesEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`finalScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `performanceEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positionCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`competencyId` int NOT NULL,
	`requiredLevel` int NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `positionCompetencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`level` enum('junior','pleno','senior','especialista','coordenador','gerente','diretor'),
	`departmentId` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `positions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `successionCandidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`employeeId` int NOT NULL,
	`readinessLevel` enum('imediato','1_ano','2_3_anos','mais_3_anos') NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`developmentPlanId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successionCandidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`currentHolderId` int,
	`isCritical` boolean NOT NULL DEFAULT false,
	`riskLevel` enum('baixo','medio','alto','critico') NOT NULL DEFAULT 'medio',
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','rh','gestor','colaborador') NOT NULL DEFAULT 'colaborador';--> statement-breakpoint
ALTER TABLE `users` ADD `faceDescriptor` text;--> statement-breakpoint
ALTER TABLE `users` ADD `facePhotoUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `faceRegisteredAt` datetime;