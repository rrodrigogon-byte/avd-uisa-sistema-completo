CREATE TABLE `analyticsMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(100) NOT NULL,
	`period` varchar(20) NOT NULL,
	`dimension` varchar(100),
	`dimensionValue` varchar(255),
	`value` int NOT NULL,
	`metadata` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemType` enum('pir','job_description','time_adjustment','development_plan','bonus','expense','outro') NOT NULL,
	`itemId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`requestedBy` int NOT NULL,
	`approverId` int NOT NULL,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`comments` text,
	`decidedAt` timestamp,
	`priority` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`employeeId` int NOT NULL,
	`baseAmount` int NOT NULL,
	`appliedMultipliers` text,
	`finalAmount` int NOT NULL,
	`performanceScore` int,
	`goalAchievementPercentage` int,
	`paymentStatus` enum('calculado','aprovado','pago','cancelado') NOT NULL DEFAULT 'calculado',
	`paidAt` timestamp,
	`notes` text,
	`calculatedBy` int NOT NULL,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonusCalculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusEligibility` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`employeeId` int NOT NULL,
	`isEligible` boolean NOT NULL DEFAULT true,
	`ineligibilityReason` text,
	`multiplier` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonusEligibility_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusPrograms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('performance','goal_achievement','profit_sharing','retention','project','spot') NOT NULL,
	`period` varchar(100) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`totalBudget` int,
	`status` enum('planejamento','ativo','em_calculo','pago','cancelado') NOT NULL DEFAULT 'planejamento',
	`eligibilityCriteria` text,
	`calculationFormula` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bonusPrograms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('tecnica','comportamental','lideranca') NOT NULL,
	`description` text,
	`category` varchar(100),
	`proficiencyLevels` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`description` text,
	`parentId` int,
	`managerId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_name_unique` UNIQUE(`name`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `developmentActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('training','course','mentoring','project','reading','certification','other') NOT NULL,
	`status` enum('not_started','in_progress','completed','cancelled') NOT NULL DEFAULT 'not_started',
	`deadline` timestamp,
	`completedAt` timestamp,
	`comments` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developmentActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `developmentPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`period` varchar(100) NOT NULL,
	`status` enum('rascunho','ativo','concluido','cancelado') NOT NULL DEFAULT 'rascunho',
	`managerId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`completionPercentage` int DEFAULT 0,
	`evaluationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developmentPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employeeNumber` varchar(50),
	`department` varchar(100),
	`position` varchar(255),
	`level` varchar(50),
	`managerId` int,
	`hireDate` timestamp,
	`contractType` enum('clt','pj','estagio','temporario','terceirizado'),
	`status` enum('ativo','ferias','afastado','desligado') NOT NULL DEFAULT 'ativo',
	`location` varchar(100),
	`phone` varchar(20),
	`birthDate` timestamp,
	`baseSalary` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `employees_employeeNumber_unique` UNIQUE(`employeeNumber`)
);
--> statement-breakpoint
CREATE TABLE `evaluationCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`type` enum('anual','semestral','trimestral','mensal') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('planejamento','ativo','em_avaliacao','concluido','cancelado') NOT NULL DEFAULT 'planejamento',
	`defaultTemplateId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationCycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`value` int NOT NULL,
	`percentage` int NOT NULL,
	`comments` text,
	`recordedBy` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('individual','team','organizational') NOT NULL DEFAULT 'individual',
	`category` varchar(100),
	`targetValue` int,
	`currentValue` int DEFAULT 0,
	`unit` varchar(50),
	`status` enum('not_started','in_progress','completed','cancelled','overdue') NOT NULL DEFAULT 'not_started',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`startDate` timestamp NOT NULL,
	`deadline` timestamp NOT NULL,
	`managerId` int,
	`weight` int DEFAULT 100,
	`evaluationCycle` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pendencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('avaliacao','aprovacao','documento','meta','pdi','ponto','treinamento','outro') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`status` enum('pendente','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'pendente',
	`dueDate` timestamp,
	`referenceId` int,
	`referenceType` varchar(50),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pendencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('admissao','promocao','transferencia','rebaixamento','desligamento') NOT NULL,
	`previousPosition` varchar(255),
	`newPosition` varchar(255) NOT NULL,
	`previousDepartment` varchar(100),
	`newDepartment` varchar(100),
	`previousSalary` int,
	`newSalary` int,
	`effectiveDate` timestamp NOT NULL,
	`reason` text,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `positionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `readinessAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`assessmentDate` timestamp NOT NULL,
	`assessorId` int NOT NULL,
	`readinessLevel` enum('ready_now','ready_1_year','ready_2_years','ready_3_years','not_ready') NOT NULL,
	`strengths` text,
	`developmentAreas` text,
	`recommendations` text,
	`overallScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `readinessAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successionCandidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`candidateId` int NOT NULL,
	`readinessLevel` enum('ready_now','ready_1_year','ready_2_years','ready_3_years','not_ready') NOT NULL,
	`potential` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`performance` enum('below','meets','exceeds','outstanding') NOT NULL DEFAULT 'meets',
	`competencyGaps` text,
	`developmentPlanId` int,
	`notes` text,
	`priority` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successionCandidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position` varchar(255) NOT NULL,
	`jobDescriptionId` int,
	`department` varchar(100),
	`currentOccupantId` int,
	`vacancyRisk` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`estimatedVacancyDate` timestamp,
	`status` enum('ativo','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'ativo',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('info','warning','error','security','audit') NOT NULL,
	`module` varchar(100) NOT NULL,
	`action` varchar(255) NOT NULL,
	`userId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeAdjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timeRecordId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`type` enum('entrada','saida','almoco_saida','almoco_retorno','justificativa_falta') NOT NULL,
	`originalValue` timestamp,
	`requestedValue` timestamp,
	`justification` text NOT NULL,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewComments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeAdjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeBank` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`balanceMinutes` int NOT NULL DEFAULT 0,
	`overtimeMinutes` int NOT NULL DEFAULT 0,
	`compensatedMinutes` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeBank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` timestamp NOT NULL,
	`checkIn` timestamp,
	`lunchOut` timestamp,
	`lunchIn` timestamp,
	`checkOut` timestamp,
	`totalMinutes` int,
	`overtimeMinutes` int DEFAULT 0,
	`status` enum('normal','falta','atestado','ferias','folga','pendente_ajuste') NOT NULL DEFAULT 'normal',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeRecords_id` PRIMARY KEY(`id`)
);
