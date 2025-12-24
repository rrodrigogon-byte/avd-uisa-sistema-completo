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
CREATE TABLE `accessAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`userEmail` varchar(320),
	`action` varchar(100) NOT NULL,
	`resource` varchar(100) NOT NULL,
	`resourceId` int,
	`actionType` enum('create','read','update','delete','approve','reject','export','import','login','logout','permission_change') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`requestMethod` varchar(10),
	`requestPath` varchar(500),
	`oldValue` text,
	`newValue` text,
	`success` boolean NOT NULL,
	`errorMessage` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`sessionId` varchar(255),
	CONSTRAINT `accessAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`userId` int NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`activityDescription` varchar(500),
	`entityType` varchar(100),
	`entityId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `adminUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('super_admin','admin','hr_manager') NOT NULL DEFAULT 'admin',
	`active` boolean NOT NULL DEFAULT true,
	`lastLoginAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminUsers_username_unique` UNIQUE(`username`),
	CONSTRAINT `adminUsers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `advancedReportExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportType` enum('movimentacoes','desempenho','hierarquia','competencias','pdi','avaliacoes','metas','bonus','customizado') NOT NULL,
	`format` enum('excel','pdf') NOT NULL,
	`filters` json,
	`chartConfig` json,
	`status` enum('pendente','processando','concluido','erro') NOT NULL DEFAULT 'pendente',
	`fileUrl` text,
	`fileSize` int,
	`errorMessage` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `advancedReportExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `approvalRuleHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`action` enum('criado','atualizado','desativado','excluido') NOT NULL,
	`previousData` text,
	`newData` text,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalRuleHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleType` enum('departamento','centro_custo','individual') NOT NULL,
	`approvalContext` enum('metas','avaliacoes','pdi','descricao_cargo','ciclo_360','bonus','promocao','todos') NOT NULL DEFAULT 'todos',
	`departmentId` int,
	`costCenterId` int,
	`employeeId` int,
	`approverId` int NOT NULL,
	`approverLevel` int NOT NULL DEFAULT 1,
	`requiresSequentialApproval` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalRules_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
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
CREATE TABLE `autoGeneratedGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`gapAnalysisId` int NOT NULL,
	`templateId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`specific` text,
	`measurable` text,
	`achievable` text,
	`relevant` text,
	`timeBound` text,
	`suggestedStartDate` datetime NOT NULL,
	`suggestedEndDate` datetime NOT NULL,
	`suggestedActions` json,
	`suggestedResources` json,
	`successCriteria` json,
	`targetScore` int,
	`suggestedOwnerId` int,
	`suggestedMentorId` int,
	`status` enum('pendente','aprovada','rejeitada','modificada') NOT NULL DEFAULT 'pendente',
	`approvedBy` int,
	`approvedAt` datetime,
	`rejectionReason` text,
	`pdiPlanId` int,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autoGeneratedGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdAssessmentProcesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`status` enum('em_andamento','concluido','cancelado') NOT NULL DEFAULT 'em_andamento',
	`currentStep` int NOT NULL DEFAULT 1,
	`step1CompletedAt` datetime,
	`step2CompletedAt` datetime,
	`step3CompletedAt` datetime,
	`step4CompletedAt` datetime,
	`step5CompletedAt` datetime,
	`step1Id` int,
	`step2Id` int,
	`step3Id` int,
	`step4Id` int,
	`step5Id` int,
	`step1Data` json,
	`step2Data` json,
	`step3Data` json,
	`step4Data` json,
	`step5Data` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `avdAssessmentProcesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdCompetencyAssessmentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`competencyId` int NOT NULL,
	`score` int NOT NULL,
	`comments` text,
	`behaviorExamples` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avdCompetencyAssessmentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdCompetencyAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`employeeId` int NOT NULL,
	`assessmentType` enum('autoavaliacao','avaliacao_gestor','avaliacao_pares') NOT NULL DEFAULT 'autoavaliacao',
	`evaluatorId` int,
	`status` enum('em_andamento','concluida') NOT NULL DEFAULT 'em_andamento',
	`overallScore` int,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `avdCompetencyAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdDevelopmentActionProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`progressPercent` int NOT NULL,
	`comments` text,
	`evidenceUrl` varchar(512),
	`evidenceType` varchar(50),
	`registeredBy` int NOT NULL,
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avdDevelopmentActionProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdDevelopmentActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`competencyId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`actionType` enum('experiencia_pratica','mentoria_feedback','treinamento_formal') NOT NULL,
	`category` varchar(100),
	`responsibleId` int,
	`dueDate` datetime NOT NULL,
	`successMetrics` text,
	`expectedOutcome` text,
	`status` enum('nao_iniciada','em_andamento','concluida','cancelada','atrasada') NOT NULL DEFAULT 'nao_iniciada',
	`progress` int NOT NULL DEFAULT 0,
	`evidences` text,
	`effectiveness` int,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `avdDevelopmentActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdDevelopmentPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`employeeId` int NOT NULL,
	`performanceAssessmentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`objectives` text,
	`status` enum('rascunho','aguardando_aprovacao','aprovado','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'rascunho',
	`approvedBy` int,
	`approvedAt` datetime,
	`approvalComments` text,
	`overallProgress` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `avdDevelopmentPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avdPerformanceAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`employeeId` int NOT NULL,
	`profileScore` int,
	`pirScore` int,
	`competencyScore` int,
	`profileWeight` int NOT NULL DEFAULT 20,
	`pirWeight` int NOT NULL DEFAULT 20,
	`competencyWeight` int NOT NULL DEFAULT 60,
	`finalScore` int NOT NULL,
	`performanceRating` enum('insatisfatorio','abaixo_expectativas','atende_expectativas','supera_expectativas','excepcional') NOT NULL,
	`strengthsAnalysis` text,
	`gapsAnalysis` text,
	`developmentRecommendations` text,
	`careerRecommendations` text,
	`evaluatorComments` text,
	`evaluatorId` int,
	`status` enum('em_andamento','concluida','aprovada') NOT NULL DEFAULT 'em_andamento',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	`approvedAt` datetime,
	`approvedBy` int,
	CONSTRAINT `avdPerformanceAssessments_id` PRIMARY KEY(`id`)
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
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50),
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50),
	`category` enum('metas','pdi','avaliacao','feedback','geral') NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`condition` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(100) NOT NULL,
	`approverId` int NOT NULL,
	`approverName` varchar(255),
	`approvalLevel` int NOT NULL,
	`jobDescriptionIds` json NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`totalItems` int NOT NULL,
	`approvedCount` int NOT NULL DEFAULT 0,
	`rejectedCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`batchComments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` datetime,
	CONSTRAINT `batchApprovals_id` PRIMARY KEY(`id`),
	CONSTRAINT `batchApprovals_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE TABLE `batchEmailSends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(100) NOT NULL,
	`templateId` int NOT NULL,
	`totalRecipients` int NOT NULL,
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','partially_completed','failed') NOT NULL DEFAULT 'pending',
	`scheduledFor` datetime,
	`createdBy` int NOT NULL,
	`createdByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` datetime,
	`completedAt` datetime,
	CONSTRAINT `batchEmailSends_id` PRIMARY KEY(`id`),
	CONSTRAINT `batchEmailSends_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE TABLE `bodyLanguageAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoRecordingId` int NOT NULL,
	`questionId` int,
	`timestamp` int NOT NULL,
	`headMovement` varchar(50),
	`eyeContact` enum('direct','averted','looking_away','closed'),
	`posture` enum('upright','slouched','leaning_forward','leaning_back'),
	`handGestures` varchar(255),
	`nervousnessIndicators` json,
	`nervousnessScore` int,
	`confidenceIndicators` json,
	`confidenceScore` int,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bodyLanguageAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusApprovalComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`calculationId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonusApprovalComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`workflowId` int NOT NULL,
	`eligibleAmountCents` int NOT NULL,
	`extraBonusPercentage` int DEFAULT 0,
	`finalAmountCents` int NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 1,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`level1Status` enum('pending','approved','rejected') DEFAULT 'pending',
	`level1ApproverId` int,
	`level1ApprovedAt` timestamp,
	`level1Comments` text,
	`level2Status` enum('pending','approved','rejected') DEFAULT 'pending',
	`level2ApproverId` int,
	`level2ApprovedAt` timestamp,
	`level2Comments` text,
	`level3Status` enum('pending','approved','rejected') DEFAULT 'pending',
	`level3ApproverId` int,
	`level3ApprovedAt` timestamp,
	`level3Comments` text,
	`level4Status` enum('pending','approved','rejected') DEFAULT 'pending',
	`level4ApproverId` int,
	`level4ApprovedAt` timestamp,
	`level4Comments` text,
	`level5Status` enum('pending','approved','rejected') DEFAULT 'pending',
	`level5ApproverId` int,
	`level5ApprovedAt` timestamp,
	`level5Comments` text,
	`signedPdfUrl` varchar(500),
	`sentToFinanceAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bonusApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('policy','calculation') NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('created','updated','deleted','approved','rejected','paid') NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonusAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`baseSalaryCents` int NOT NULL,
	`appliedMultiplierPercent` int NOT NULL,
	`bonusAmountCents` int NOT NULL,
	`performanceScore` int,
	`goalCompletionRate` int,
	`adjustmentReason` text,
	`status` enum('calculado','aprovado','pago','cancelado') NOT NULL DEFAULT 'calculado',
	`approvedBy` int,
	`approvedAt` datetime,
	`paidAt` datetime,
	`calculatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`referenceMonth` varchar(7) NOT NULL,
	CONSTRAINT `bonusCalculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`positionName` varchar(255) NOT NULL,
	`baseSalaryMultiplierPercent` int NOT NULL DEFAULT 0,
	`extraBonusPercentage` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bonusConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`positionId` int,
	`departmentId` int,
	`salaryMultiplierPercent` int NOT NULL,
	`minMultiplierPercent` int DEFAULT 50,
	`maxMultiplierPercent` int DEFAULT 200,
	`minPerformanceRating` enum('abaixo_expectativas','atende_expectativas','supera_expectativas','excepcional') DEFAULT 'atende_expectativas',
	`minTenureMonths` int DEFAULT 6,
	`requiresGoalCompletion` boolean DEFAULT true,
	`minGoalCompletionRate` int DEFAULT 70,
	`validFrom` datetime NOT NULL,
	`validUntil` datetime,
	`active` boolean NOT NULL DEFAULT true,
	`approvalStatus` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`approvedBy` int,
	`approvedAt` datetime,
	`createdBy` int NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `bonusPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bonusWorkflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`approver1Id` int,
	`approver1Role` varchar(100),
	`approver2Id` int,
	`approver2Role` varchar(100),
	`approver3Id` int,
	`approver3Role` varchar(100),
	`approver4Id` int,
	`approver4Role` varchar(100),
	`approver5Id` int,
	`approver5Role` varchar(100),
	`requireAllApprovals` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bonusWorkflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`movementId` int NOT NULL,
	`approverId` int NOT NULL,
	`approverRole` enum('hr','people_director','area_director') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`evidence` text,
	`comments` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationComparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`selfScore` int,
	`managerScore` int,
	`peerScores` json,
	`consensusScore` int,
	`consensusReachedAt` datetime,
	`consensusBy` int,
	`hasDiscrepancy` boolean NOT NULL DEFAULT false,
	`discrepancyReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationComparisons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`movedBy` int NOT NULL,
	`fromPerformance` enum('baixo','médio','alto'),
	`fromPotential` enum('baixo','médio','alto'),
	`toPerformance` enum('baixo','médio','alto') NOT NULL,
	`toPotential` enum('baixo','médio','alto') NOT NULL,
	`justification` text NOT NULL,
	`status` enum('pending','approved_hr','approved_people_director','approved_area_director','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('facilitator','participant','observer') NOT NULL DEFAULT 'participant',
	`joinedAt` datetime,
	`leftAt` datetime,
	`isOnline` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`originalScore` int NOT NULL,
	`calibratedScore` int NOT NULL,
	`reason` text NOT NULL,
	`reviewedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionName` varchar(255),
	`cycleId` int,
	`departmentId` int,
	`departmentFilter` text,
	`levelFilter` text,
	`facilitatorId` int,
	`createdBy` int,
	`status` enum('draft','in_progress','completed','agendada','em_andamento','concluida') NOT NULL DEFAULT 'draft',
	`scheduledDate` datetime,
	`startedAt` datetime,
	`completedAt` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`voterId` int NOT NULL,
	`proposedScore` int NOT NULL,
	`justification` text,
	`voteType` enum('approve','reject','abstain') NOT NULL DEFAULT 'approve',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationWorkflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`steps` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationWorkflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cboCargos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoCBO` varchar(10) NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricaoSumaria` text,
	`formacao` text,
	`experiencia` text,
	`condicoesExercicio` text,
	`recursosTrabalho` json,
	`atividadesPrincipais` json,
	`competenciasPessoais` json,
	`familiaOcupacional` varchar(255),
	`sinonimos` json,
	`ultimaAtualizacao` datetime,
	`fonteDados` varchar(255) DEFAULT 'API CBO',
	`vezesUtilizado` int NOT NULL DEFAULT 0,
	`ultimoUso` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cboCargos_id` PRIMARY KEY(`id`),
	CONSTRAINT `cboCargos_codigoCBO_unique` UNIQUE(`codigoCBO`)
);
--> statement-breakpoint
CREATE TABLE `cboSearchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`searchTerm` varchar(255) NOT NULL,
	`codigoCBOSelecionado` varchar(10),
	`resultadosEncontrados` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cboSearchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clockTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`dataAvaliacao` datetime NOT NULL,
	`imagemUrl` varchar(512),
	`pontuacaoCirculo` int NOT NULL,
	`pontuacaoNumeros` int NOT NULL,
	`pontuacaoPonteiros` int NOT NULL,
	`pontuacaoTotal` int NOT NULL,
	`classificacao` enum('normal','comprometimento_leve','comprometimento_moderado','comprometimento_grave') NOT NULL,
	`observacoes` text,
	`avaliadorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clockTests_id` PRIMARY KEY(`id`)
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
CREATE TABLE `consolidatedMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` enum('overall_completion_rate','average_performance','department_performance','competency_gap','pdi_progress','assessment_distribution') NOT NULL,
	`departmentId` int,
	`positionId` int,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`metricValue` int NOT NULL,
	`metricData` json,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `consolidatedMetrics_id` PRIMARY KEY(`id`)
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
CREATE TABLE `consolidatedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int,
	`reportType` enum('individual','equipe','departamento','empresa','comparativo','evolucao','gaps','nine_box','sucessao') NOT NULL,
	`filters` text,
	`data` text NOT NULL,
	`generatedBy` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` datetime,
	CONSTRAINT `consolidatedReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costCenters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`departmentId` int,
	`budgetCents` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `costCenters_id` PRIMARY KEY(`id`),
	CONSTRAINT `costCenters_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `customReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`metrics` json NOT NULL,
	`filters` json,
	`chartType` varchar(50),
	`isTemplate` boolean NOT NULL DEFAULT false,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cycle360Drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`draftKey` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`userName` varchar(200),
	`draftData` text NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycle360Drafts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cycle360Drafts_draftKey_unique` UNIQUE(`draftKey`)
);
--> statement-breakpoint
CREATE TABLE `cycle360Templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`creatorName` varchar(200),
	`selfWeight` int NOT NULL DEFAULT 20,
	`peerWeight` int NOT NULL DEFAULT 30,
	`subordinateWeight` int NOT NULL DEFAULT 20,
	`managerWeight` int NOT NULL DEFAULT 30,
	`competencyIds` text NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycle360Templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departmentAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentId` int NOT NULL,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`totalEmployees` int NOT NULL DEFAULT 0,
	`completedAssessments` int NOT NULL DEFAULT 0,
	`completionRate` int NOT NULL DEFAULT 0,
	`averagePerformanceScore` int,
	`averageCompetencyScore` int,
	`averagePirScore` int,
	`criticalGapsCount` int NOT NULL DEFAULT 0,
	`activePdisCount` int NOT NULL DEFAULT 0,
	`pdiCompletionRate` int NOT NULL DEFAULT 0,
	`competencyBreakdown` json,
	`topGaps` json,
	`topPerformers` json,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departmentAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departmentGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentId` int NOT NULL,
	`cycleId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`targetValue` int,
	`currentValue` int DEFAULT 0,
	`unit` varchar(50),
	`weight` int NOT NULL DEFAULT 10,
	`startDate` datetime,
	`dueDate` datetime,
	`status` enum('rascunho','aprovada','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'rascunho',
	`progressPercent` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departmentGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departmentPerformanceSummary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentId` int NOT NULL,
	`periodYear` int NOT NULL,
	`periodQuarter` int,
	`totalEmployees` int NOT NULL,
	`evaluatedEmployees` int NOT NULL,
	`averageScore` int,
	`topPerformerCount` int NOT NULL DEFAULT 0,
	`lowPerformerCount` int NOT NULL DEFAULT 0,
	`ratingDistribution` text,
	`scoreChange` int,
	`trend` enum('melhorando','estavel','declinando'),
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departmentPerformanceSummary_id` PRIMARY KEY(`id`)
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
CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailQueueId` int,
	`destinatario` varchar(320) NOT NULL,
	`assunto` varchar(500) NOT NULL,
	`tipoEmail` varchar(100) NOT NULL,
	`status` enum('sucesso','falha','bounce','spam') NOT NULL,
	`tentativa` int NOT NULL,
	`erroMensagem` text,
	`tempoResposta` int,
	`smtpResponse` text,
	`metadados` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
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
CREATE TABLE `emailQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`destinatario` varchar(320) NOT NULL,
	`assunto` varchar(500) NOT NULL,
	`corpo` text NOT NULL,
	`tipoEmail` varchar(100) NOT NULL,
	`prioridade` enum('baixa','normal','alta','urgente') NOT NULL DEFAULT 'normal',
	`status` enum('pendente','enviando','enviado','falhou','cancelado') NOT NULL DEFAULT 'pendente',
	`tentativas` int NOT NULL DEFAULT 0,
	`maxTentativas` int NOT NULL DEFAULT 3,
	`proximaTentativa` datetime,
	`erroMensagem` text,
	`metadados` text,
	`enviadoEm` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSendLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduledEmailId` int,
	`batchEmailId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`status` enum('sent','failed','bounced','complained') NOT NULL,
	`messageId` varchar(255),
	`errorMessage` text,
	`opened` boolean NOT NULL DEFAULT false,
	`openedAt` datetime,
	`clicked` boolean NOT NULL DEFAULT false,
	`clickedAt` datetime,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailSendLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateCode` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateType` enum('evaluation_invitation','evaluation_reminder','evaluation_completed','approval_request','approval_reminder','approval_completed','pir_invitation','pir_results','general_notification') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`availableVariables` json,
	`fromName` varchar(255),
	`replyTo` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailTemplates_templateCode_unique` UNIQUE(`templateCode`)
);
--> statement-breakpoint
CREATE TABLE `employeeActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`jobDescriptionId` int,
	`responsibilityId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('reuniao','analise','planejamento','execucao','suporte','outros') NOT NULL,
	`activityDate` datetime NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`durationMinutes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`category` enum('certificado','documento','foto','curriculo','diploma','comprovante','contrato','outro') NOT NULL,
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`visibleToEmployee` boolean NOT NULL DEFAULT true,
	`visibleToManager` boolean NOT NULL DEFAULT true,
	`visibleToHR` boolean NOT NULL DEFAULT true,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` datetime,
	CONSTRAINT `employeeAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`action` enum('criado','atualizado','desativado','reativado','excluido') NOT NULL,
	`fieldChanged` varchar(100),
	`oldValue` text,
	`newValue` text,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `employeeAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`notified` boolean NOT NULL DEFAULT false,
	CONSTRAINT `employeeBadges_id` PRIMARY KEY(`id`)
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
CREATE TABLE `employeeFaceProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`referencePhotoUrl` varchar(512) NOT NULL,
	`referencePhotoKey` varchar(512) NOT NULL,
	`faceDescriptor` text NOT NULL,
	`faceEncoding` text,
	`photoQuality` enum('baixa','media','alta','excelente') DEFAULT 'media',
	`confidenceScore` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`verifiedBy` int,
	`verifiedAt` datetime,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeFaceProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `employeeFaceProfiles_employeeId_unique` UNIQUE(`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `employeeHierarchy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`employeeChapa` varchar(50) NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`employeeEmail` varchar(320),
	`employeeFunction` varchar(255),
	`employeeFunctionCode` varchar(50),
	`employeeSection` varchar(255),
	`employeeSectionCode` varchar(100),
	`coordinatorChapa` varchar(50),
	`coordinatorName` varchar(255),
	`coordinatorFunction` varchar(255),
	`coordinatorEmail` varchar(320),
	`coordinatorId` int,
	`managerChapa` varchar(50),
	`managerName` varchar(255),
	`managerFunction` varchar(255),
	`managerEmail` varchar(320),
	`managerId` int,
	`directorChapa` varchar(50),
	`directorName` varchar(255),
	`directorFunction` varchar(255),
	`directorEmail` varchar(320),
	`directorId` int,
	`presidentChapa` varchar(50),
	`presidentName` varchar(255),
	`presidentFunction` varchar(255),
	`presidentEmail` varchar(320),
	`presidentId` int,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeHierarchy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`changeType` enum('cargo','departamento','salario','gestor','status','dados_pessoais','contratacao','desligamento','promocao','transferencia','outro') NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`reason` text,
	`notes` text,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `employeeHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeImportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(512),
	`totalRecords` int NOT NULL,
	`successCount` int NOT NULL DEFAULT 0,
	`errorCount` int NOT NULL DEFAULT 0,
	`errors` text,
	`status` enum('processando','concluido','erro') NOT NULL DEFAULT 'processando',
	`importedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employeeImportHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`previousDepartmentId` int,
	`previousPositionId` int,
	`previousManagerId` int,
	`newDepartmentId` int,
	`newPositionId` int,
	`newManagerId` int,
	`movementType` enum('promocao','transferencia','mudanca_gestor','mudanca_cargo','ajuste_salarial','desligamento','admissao','retorno_afastamento','reorganizacao','outro') NOT NULL,
	`reason` text,
	`notes` text,
	`approvalStatus` enum('pendente','aprovado','rejeitado','cancelado') NOT NULL DEFAULT 'pendente',
	`approvedBy` int,
	`approvedAt` datetime,
	`effectiveDate` datetime NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employeeMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeTemporalSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`analysisResultId` int,
	`snapshotDate` datetime NOT NULL,
	`periodLabel` varchar(100) NOT NULL,
	`positionId` int,
	`departmentId` int,
	`pirScore` int,
	`pirAnswers` text,
	`pirCompletionDate` datetime,
	`totalGoals` int NOT NULL DEFAULT 0,
	`completedGoals` int NOT NULL DEFAULT 0,
	`goalCompletionRate` int,
	`score360` int,
	`evaluation360Data` text,
	`competenciesData` text,
	`videoAnalysisScore` int,
	`videoAnalysisData` text,
	`changeFromPrevious` int,
	`changeType` enum('melhoria','declinio','estavel'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employeeTemporalSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`employeeCode` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`personalEmail` varchar(320),
	`corporateEmail` varchar(320),
	`passwordHash` varchar(255),
	`cpf` varchar(14),
	`birthDate` datetime,
	`hireDate` datetime,
	`departmentId` int,
	`positionId` int,
	`managerId` int,
	`costCenter` varchar(100),
	`active` boolean NOT NULL DEFAULT true,
	`chapa` varchar(50),
	`codSecao` varchar(100),
	`secao` varchar(255),
	`codFuncao` varchar(50),
	`funcao` varchar(255),
	`situacao` varchar(50),
	`gerencia` varchar(255),
	`diretoria` varchar(255),
	`cargo` varchar(255),
	`telefone` varchar(50),
	`salary` int,
	`hierarchyLevel` enum('diretoria','gerencia','coordenacao','supervisao','operacional'),
	`empresa` varchar(255),
	`chapaPresidente` varchar(50),
	`presidente` varchar(255),
	`funcaoPresidente` varchar(255),
	`emailPresidente` varchar(320),
	`chapaDiretor` varchar(50),
	`diretor` varchar(255),
	`funcaoDiretor` varchar(255),
	`emailDiretor` varchar(320),
	`chapaGestor` varchar(50),
	`gestor` varchar(255),
	`funcaoGestor` varchar(255),
	`emailGestor` varchar(320),
	`chapaCoordenador` varchar(50),
	`coordenador` varchar(255),
	`funcaoCoordenador` varchar(255),
	`emailCoordenador` varchar(320),
	`photoUrl` varchar(512),
	`phone` varchar(20),
	`address` text,
	`status` enum('ativo','afastado','desligado') NOT NULL DEFAULT 'ativo',
	`rmCode` varchar(50),
	`rmLastSync` datetime,
	`gamificationPoints` int NOT NULL DEFAULT 0,
	`gamificationLevel` varchar(20) NOT NULL DEFAULT 'Bronze',
	`lastPointsUpdate` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `employees_employeeCode_unique` UNIQUE(`employeeCode`),
	CONSTRAINT `employees_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `ethicsIndicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`ethicsScore` int,
	`integrityScore` int,
	`honestyScore` int,
	`reliabilityScore` int,
	`overallScore` int,
	`classification` enum('muito_baixo','baixo','medio','alto','muito_alto'),
	`recommendation` text,
	`alerts` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ethicsIndicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation360CycleCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`competencyId` int NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`minLevel` int NOT NULL DEFAULT 1,
	`maxLevel` int NOT NULL DEFAULT 5,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleCompetencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation360CycleConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`tempData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation360CycleParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`participationType` enum('evaluated','evaluator','both') NOT NULL DEFAULT 'evaluated',
	`managerId` int,
	`peerIds` text,
	`subordinateIds` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation360CycleWeights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`selfWeight` int NOT NULL DEFAULT 25,
	`managerWeight` int NOT NULL DEFAULT 25,
	`peersWeight` int NOT NULL DEFAULT 25,
	`subordinatesWeight` int NOT NULL DEFAULT 25,
	`selfEvaluationDeadline` datetime,
	`managerEvaluationDeadline` datetime,
	`peersEvaluationDeadline` datetime,
	`subordinatesEvaluationDeadline` datetime,
	`consensusDeadline` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation360CycleWeights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int,
	`participantId` int,
	`evaluatorId` int NOT NULL,
	`questionId` int,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(512) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`criteriaId` int,
	`authorId` int NOT NULL,
	`comment` text NOT NULL,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationCriteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`category` enum('competencia','meta','comportamento','resultado') NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`minScore` int NOT NULL DEFAULT 1,
	`maxScore` int NOT NULL DEFAULT 5,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationCriteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationCriteriaResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`criteriaId` int NOT NULL,
	`score` int NOT NULL,
	`comments` text,
	`evidences` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationCriteriaResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`type` enum('anual','semestral','trimestral') NOT NULL,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`status` enum('planejado','ativo','concluido','cancelado') NOT NULL DEFAULT 'planejado',
	`active` boolean NOT NULL DEFAULT true,
	`description` text,
	`selfEvaluationDeadline` datetime,
	`managerEvaluationDeadline` datetime,
	`consensusDeadline` datetime,
	`approvedForGoals` boolean NOT NULL DEFAULT false,
	`approvedForGoalsAt` datetime,
	`approvedForGoalsBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationCycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`employeeId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`cycleId` int,
	`evaluationType` enum('autoavaliacao','superior','par','subordinado','cliente') NOT NULL,
	`status` enum('pendente','em_andamento','concluida','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`dueDate` datetime,
	`startedAt` datetime,
	`completedAt` datetime,
	`approvedAt` datetime,
	`approvedBy` int,
	`totalScore` int,
	`maxPossibleScore` int,
	`finalRating` enum('insatisfatorio','abaixo_expectativas','atende_expectativas','supera_expectativas','excepcional'),
	`generalComments` text,
	`strengths` text,
	`improvements` text,
	`notificationSent` boolean NOT NULL DEFAULT false,
	`remindersSent` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationInstances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationProcesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('360','180','90','autoavaliacao','gestor','pares','subordinados') NOT NULL,
	`status` enum('rascunho','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'rascunho',
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`allowSelfEvaluation` boolean NOT NULL DEFAULT true,
	`allowManagerEvaluation` boolean NOT NULL DEFAULT true,
	`allowPeerEvaluation` boolean NOT NULL DEFAULT false,
	`allowSubordinateEvaluation` boolean NOT NULL DEFAULT false,
	`minPeerEvaluators` int DEFAULT 0,
	`maxPeerEvaluators` int DEFAULT 5,
	`minSubordinateEvaluators` int DEFAULT 0,
	`maxSubordinateEvaluators` int DEFAULT 5,
	`selfWeight` int DEFAULT 20,
	`managerWeight` int DEFAULT 50,
	`peerWeight` int DEFAULT 15,
	`subordinateWeight` int DEFAULT 15,
	`formTemplateId` int,
	`sendStartNotification` boolean NOT NULL DEFAULT true,
	`sendReminderNotification` boolean NOT NULL DEFAULT true,
	`reminderDaysBefore` int DEFAULT 3,
	`sendCompletionNotification` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `evaluationProcesses_id` PRIMARY KEY(`id`)
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
CREATE TABLE `evaluationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`templateType` enum('360','180','90','custom') NOT NULL DEFAULT 'custom',
	`hierarchyLevel` enum('operacional','coordenacao','gerencia','diretoria'),
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
CREATE TABLE `evaluationWeightConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`scope` enum('global','departamento','cargo') NOT NULL DEFAULT 'global',
	`departmentId` int,
	`positionId` int,
	`competenciesWeight` int NOT NULL DEFAULT 40,
	`individualGoalsWeight` int NOT NULL DEFAULT 30,
	`departmentGoalsWeight` int NOT NULL DEFAULT 15,
	`pirWeight` int NOT NULL DEFAULT 15,
	`feedbackWeight` int DEFAULT 0,
	`behaviorWeight` int DEFAULT 0,
	`validFrom` datetime NOT NULL,
	`validUntil` datetime,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluationWeightConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationWeightHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`previousWeights` json,
	`newWeights` json,
	`changeReason` text,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationWeightHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faceEmbeddings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`gcpFaceDescriptor` text NOT NULL,
	`gcpFaceId` varchar(255),
	`primaryPhotoUrl` varchar(512) NOT NULL,
	`secondaryPhotoUrl` varchar(512),
	`faceQualityScore` int,
	`lightingQuality` enum('ruim','aceitavel','boa','excelente'),
	`faceAngle` varchar(50),
	`registeredBy` int NOT NULL,
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	`lastValidatedAt` datetime,
	`validationCount` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faceEmbeddings_id` PRIMARY KEY(`id`),
	CONSTRAINT `faceEmbeddings_employeeId_unique` UNIQUE(`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `faceValidationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`pirAssessmentId` int,
	`validationPhotoUrl` varchar(512) NOT NULL,
	`matchScore` int NOT NULL,
	`matchResult` enum('sucesso','falha','inconclusivo') NOT NULL,
	`gcpResponseData` text,
	`facesDetected` int NOT NULL DEFAULT 1,
	`primaryFaceConfidence` int,
	`validationType` enum('cadastro_inicial','avaliacao_pir','atualizacao_perfil','verificacao_manual') NOT NULL,
	`approved` boolean NOT NULL,
	`rejectionReason` text,
	`reviewedBy` int,
	`reviewedAt` datetime,
	`validatedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `faceValidationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facialMicroExpressions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoRecordingId` int NOT NULL,
	`questionId` int,
	`timestamp` int NOT NULL,
	`expression` enum('neutral','happiness','sadness','anger','fear','disgust','surprise','contempt') NOT NULL,
	`intensity` int NOT NULL,
	`confidence` int NOT NULL,
	`duration` int,
	`isMicroExpression` boolean NOT NULL DEFAULT false,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `facialMicroExpressions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('positivo','construtivo','desenvolvimento') NOT NULL,
	`category` varchar(100),
	`content` text NOT NULL,
	`context` text,
	`actionItems` text,
	`linkedPDIId` int,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`acknowledgedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`question` text NOT NULL,
	`description` text,
	`type` enum('escala','multipla_escolha','texto_curto','texto_longo','matriz','sim_nao','data','numero') NOT NULL,
	`scaleMin` int DEFAULT 1,
	`scaleMax` int DEFAULT 5,
	`scaleMinLabel` varchar(100),
	`scaleMaxLabel` varchar(100),
	`options` text,
	`required` boolean NOT NULL DEFAULT true,
	`minLength` int,
	`maxLength` int,
	`weight` int NOT NULL DEFAULT 1,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `formQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int,
	`participantId` int,
	`evaluatorId` int NOT NULL,
	`questionId` int NOT NULL,
	`responseType` enum('number','text','json') NOT NULL,
	`numberValue` int,
	`textValue` text,
	`jsonValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `formSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`type` enum('avaliacao_desempenho','feedback','competencias','metas','pdi','outro') NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`allowComments` boolean NOT NULL DEFAULT true,
	`allowAttachments` boolean NOT NULL DEFAULT false,
	`requireAllQuestions` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`usageCount` int DEFAULT 0,
	CONSTRAINT `formTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fraudDetectionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`videoAnalysisId` int,
	`fraudType` enum('multiplas_faces','face_nao_correspondente','ausencia_face','mudanca_pessoa','video_manipulado','outro') NOT NULL,
	`description` text,
	`severity` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`confidenceLevel` int,
	`evidenceData` text,
	`actionTaken` text,
	`reviewedBy` int,
	`reviewedAt` datetime,
	`reviewNotes` text,
	`status` enum('pendente_revisao','confirmada','falso_positivo','resolvida') NOT NULL DEFAULT 'pendente_revisao',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fraudDetectionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gapAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`competencyId` int NOT NULL,
	`sourceType` enum('avaliacao_competencias','avaliacao_desempenho','pir','feedback_360') NOT NULL,
	`sourceId` int NOT NULL,
	`currentScore` int NOT NULL,
	`targetScore` int NOT NULL,
	`gapSize` int NOT NULL,
	`gapLevel` enum('critico','alto','medio','baixo') NOT NULL,
	`priority` enum('baixa','media','alta','critica') NOT NULL,
	`impactOnPerformance` int,
	`developmentDifficulty` enum('facil','medio','dificil'),
	`context` text,
	`relatedGaps` json,
	`status` enum('identificado','em_desenvolvimento','resolvido','ignorado') NOT NULL DEFAULT 'identificado',
	`resolvedAt` datetime,
	`identifiedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gapAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gdsTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`dataAvaliacao` datetime NOT NULL,
	`q1_satisfeitoVida` int NOT NULL,
	`q2_abandonouAtividades` int NOT NULL,
	`q3_vidaVazia` int NOT NULL,
	`q4_aborrece` int NOT NULL,
	`q5_bomHumor` int NOT NULL,
	`q6_medoCoisaRuim` int NOT NULL,
	`q7_felizMaiorTempo` int NOT NULL,
	`q8_desamparado` int NOT NULL,
	`q9_prefereFicarCasa` int NOT NULL,
	`q10_problemasMemoria` int NOT NULL,
	`q11_bomEstarVivo` int NOT NULL,
	`q12_inutil` int NOT NULL,
	`q13_cheioEnergia` int NOT NULL,
	`q14_situacaoSemEsperanca` int NOT NULL,
	`q15_outrosMelhorSituacao` int NOT NULL,
	`pontuacaoTotal` int NOT NULL,
	`classificacao` enum('normal','depressao_leve','depressao_grave') NOT NULL,
	`observacoes` text,
	`avaliadorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gdsTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int,
	`title` varchar(255) NOT NULL,
	`reportType` varchar(50) NOT NULL,
	`filters` text,
	`fileUrl` varchar(512),
	`fileFormat` enum('pdf','excel','csv') NOT NULL,
	`fileSize` int,
	`status` enum('gerando','concluido','erro') NOT NULL DEFAULT 'gerando',
	`errorMessage` text,
	`generatedBy` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` datetime,
	CONSTRAINT `generatedReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `geriatricPatients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`dataNascimento` date NOT NULL,
	`cpf` varchar(14),
	`rg` varchar(20),
	`sexo` enum('masculino','feminino','outro'),
	`telefone` varchar(20),
	`email` varchar(320),
	`endereco` text,
	`escolaridade` enum('analfabeto','fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao'),
	`historicoMedico` text,
	`medicamentosEmUso` text,
	`nomeResponsavel` varchar(255),
	`telefoneResponsavel` varchar(20),
	`parentescoResponsavel` varchar(100),
	`ativo` boolean NOT NULL DEFAULT true,
	`observacoes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `geriatricPatients_id` PRIMARY KEY(`id`),
	CONSTRAINT `geriatricPatients_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `goalApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`approverId` int NOT NULL,
	`approverRole` enum('manager','hr','director') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comments` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`authorId` int NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalEvidences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`description` text NOT NULL,
	`attachmentUrl` varchar(500),
	`attachmentName` varchar(255),
	`attachmentType` varchar(100),
	`attachmentSize` int,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`isVerified` boolean NOT NULL DEFAULT false,
	`verifiedBy` int,
	`verifiedAt` timestamp,
	CONSTRAINT `goalEvidences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalGenerationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`triggerType` enum('avaliacao_concluida','gap_identificado','solicitacao_manual','revisao_periodica') NOT NULL,
	`triggerId` int,
	`gapsAnalyzed` int NOT NULL DEFAULT 0,
	`goalsGenerated` int NOT NULL DEFAULT 0,
	`goalsApproved` int NOT NULL DEFAULT 0,
	`goalsRejected` int NOT NULL DEFAULT 0,
	`analysisData` json,
	`generatedGoalIds` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`generatedBy` int,
	CONSTRAINT `goalGenerationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` date NOT NULL,
	`status` enum('pending','in_progress','completed','delayed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `goalMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencyId` int NOT NULL,
	`gapLevel` enum('critico','alto','medio','baixo') NOT NULL,
	`titleTemplate` varchar(255) NOT NULL,
	`descriptionTemplate` text,
	`suggestedDurationDays` int NOT NULL,
	`suggestedActions` json,
	`suggestedResources` json,
	`successCriteria` json,
	`targetScore` int,
	`category` varchar(100),
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goalTemplates_id` PRIMARY KEY(`id`)
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
	`employeeId` int,
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
	`parentGoalId` int,
	`departmentId` int,
	`alignmentPercentage` int DEFAULT 0,
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `individualGoalProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`previousValue` int,
	`newValue` int NOT NULL,
	`previousPercent` int,
	`newPercent` int NOT NULL,
	`comment` text,
	`evidence` text,
	`recordedBy` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `individualGoalProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `individualGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`departmentGoalId` int,
	`cycleId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`specific` text,
	`measurable` text,
	`achievable` text,
	`relevant` text,
	`timeBound` text,
	`targetValue` int,
	`currentValue` int DEFAULT 0,
	`unit` varchar(50),
	`weight` int NOT NULL DEFAULT 10,
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`startDate` datetime,
	`dueDate` datetime,
	`completedAt` datetime,
	`status` enum('rascunho','pendente_aprovacao','aprovada','em_andamento','concluida','cancelada','atrasada') NOT NULL DEFAULT 'rascunho',
	`progressPercent` int NOT NULL DEFAULT 0,
	`approvedBy` int,
	`approvedAt` datetime,
	`rejectionReason` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `individualGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrityQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('likert_scale','multiple_choice','true_false','scenario') NOT NULL,
	`options` json,
	`expectedAnswer` varchar(50),
	`measuresEthics` boolean NOT NULL DEFAULT false,
	`measuresIntegrity` boolean NOT NULL DEFAULT false,
	`measuresHonesty` boolean NOT NULL DEFAULT false,
	`measuresReliability` boolean NOT NULL DEFAULT false,
	`isCrossValidation` boolean NOT NULL DEFAULT false,
	`relatedQuestionId` int,
	`socialDesirabilityFlag` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrityQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrityResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`questionId` int NOT NULL,
	`response` text NOT NULL,
	`responseValue` int,
	`responseTime` int,
	`isInconsistent` boolean NOT NULL DEFAULT false,
	`isSociallyDesirable` boolean NOT NULL DEFAULT false,
	`score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integrityResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrityTestCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`weight` int NOT NULL DEFAULT 1,
	`active` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrityTestCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `integrityTestCategories_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `integrityTestResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`testId` int NOT NULL,
	`pirAssessmentId` int,
	`answers` json NOT NULL,
	`score` int NOT NULL,
	`dimensionScores` json,
	`behavioralAnalysis` json NOT NULL,
	`alerts` json,
	`redFlags` json,
	`classification` enum('muito_baixo','baixo','medio','alto','muito_alto'),
	`recommendation` text,
	`startedAt` datetime NOT NULL,
	`completedAt` datetime NOT NULL,
	`totalTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrityTestResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrityTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`questions` json NOT NULL,
	`scoringRules` json NOT NULL,
	`categories` json,
	`timeLimit` int,
	`randomizeQuestions` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrityTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`approverId` int NOT NULL,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`comments` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	CONSTRAINT `jobApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('competencia','habilidade') NOT NULL DEFAULT 'competencia',
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobCompetencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobDescriptionApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`level1ApproverId` int NOT NULL,
	`level1ApproverName` varchar(255),
	`level1Status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`level1Comments` text,
	`level1ApprovedAt` datetime,
	`level2ApproverId` int NOT NULL,
	`level2ApproverName` varchar(255),
	`level2Status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`level2Comments` text,
	`level2ApprovedAt` datetime,
	`level3ApproverId` int NOT NULL,
	`level3ApproverName` varchar(255),
	`level3Status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`level3Comments` text,
	`level3ApprovedAt` datetime,
	`level4ApproverId` int NOT NULL,
	`level4ApproverName` varchar(255),
	`level4Status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`level4Comments` text,
	`level4ApprovedAt` datetime,
	`currentLevel` int NOT NULL DEFAULT 1,
	`overallStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `jobDescriptionApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobDescriptionWorkflow` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`status` enum('draft','pending_cs_specialist','pending_direct_leader','pending_hr_manager','pending_gai_director','approved','rejected') NOT NULL DEFAULT 'draft',
	`currentLevel` int NOT NULL DEFAULT 1,
	`csSpecialistId` int,
	`directLeaderId` int,
	`hrManagerId` int,
	`gaiDirectorId` int,
	`csSpecialistApprovedAt` datetime,
	`directLeaderApprovedAt` datetime,
	`hrManagerApprovedAt` datetime,
	`gaiDirectorApprovedAt` datetime,
	`csSpecialistComments` text,
	`directLeaderComments` text,
	`hrManagerComments` text,
	`gaiDirectorComments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `jobDescriptionWorkflow_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobDescriptionWorkflowHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`action` enum('created','submitted','approved','rejected','returned','cancelled') NOT NULL,
	`level` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`userRole` varchar(100),
	`comments` text,
	`previousStatus` varchar(50),
	`newStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobDescriptionWorkflowHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobDescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`positionTitle` varchar(255) NOT NULL,
	`departmentId` int NOT NULL,
	`departmentName` varchar(255) NOT NULL,
	`cbo` varchar(50),
	`division` varchar(255),
	`reportsTo` varchar(255),
	`revision` varchar(50),
	`mainObjective` text NOT NULL,
	`mandatoryTraining` json,
	`educationLevel` varchar(255),
	`requiredExperience` text,
	`eSocialSpecs` text,
	`status` enum('draft','pending_occupant','pending_manager','pending_hr','approved','rejected') NOT NULL DEFAULT 'draft',
	`costCenterApproverId` int,
	`salaryLeaderId` int,
	`costCenterApprovedAt` datetime,
	`salaryLeaderApprovedAt` datetime,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approvedAt` datetime,
	CONSTRAINT `jobDescriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobKnowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`level` enum('basico','intermediario','avancado','obrigatorio') NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobKnowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobResponsibilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobDescriptionId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobResponsibilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `katzTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`dataAvaliacao` datetime NOT NULL,
	`banho` int NOT NULL,
	`vestir` int NOT NULL,
	`higienePessoal` int NOT NULL,
	`transferencia` int NOT NULL,
	`continencia` int NOT NULL,
	`alimentacao` int NOT NULL,
	`pontuacaoTotal` int NOT NULL,
	`classificacao` enum('independente','dependencia_parcial','dependencia_total') NOT NULL,
	`observacoes` text,
	`avaliadorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `katzTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawtonTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`dataAvaliacao` datetime NOT NULL,
	`usarTelefone` int NOT NULL,
	`fazerCompras` int NOT NULL,
	`prepararRefeicoes` int NOT NULL,
	`cuidarCasa` int NOT NULL,
	`lavarRoupa` int NOT NULL,
	`usarTransporte` int NOT NULL,
	`controlarMedicacao` int NOT NULL,
	`controlarFinancas` int NOT NULL,
	`pontuacaoTotal` int NOT NULL,
	`classificacao` enum('independente','dependencia_parcial','dependencia_total') NOT NULL,
	`observacoes` text,
	`avaliadorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lawtonTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadershipHierarchy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`managerId` int,
	`managerName` varchar(255),
	`level` int NOT NULL,
	`path` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadershipHierarchy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `managerChangeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`employeeName` varchar(255),
	`employeeCode` varchar(50),
	`oldManagerId` int,
	`oldManagerName` varchar(255),
	`newManagerId` int,
	`newManagerName` varchar(255),
	`reason` text,
	`changeType` enum('promocao','transferencia','reorganizacao','desligamento_gestor','ajuste_hierarquico','outro') NOT NULL DEFAULT 'ajuste_hierarquico',
	`departmentId` int,
	`departmentName` varchar(255),
	`positionId` int,
	`positionTitle` varchar(255),
	`changedBy` int NOT NULL,
	`changedByName` varchar(255),
	`changedByRole` varchar(50),
	`requiresApproval` boolean NOT NULL DEFAULT false,
	`approvalStatus` enum('pendente','aprovado','rejeitado') DEFAULT 'aprovado',
	`approvedBy` int,
	`approvedByName` varchar(255),
	`approvedAt` datetime,
	`approvalNotes` text,
	`effectiveDate` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `managerChangeHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketBenchmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sector` varchar(100) NOT NULL,
	`position` varchar(100) NOT NULL,
	`region` varchar(100) NOT NULL DEFAULT 'Brasil',
	`avgPerformanceScore` int,
	`avgEngagementScore` int,
	`avgTurnoverRate` int,
	`avgTenureYears` int,
	`avgSalary` int,
	`medianSalary` int,
	`avgDiscD` int,
	`avgDiscI` int,
	`avgDiscS` int,
	`avgDiscC` int,
	`avgOpenness` int,
	`avgConscientiousness` int,
	`avgExtraversion` int,
	`avgAgreeableness` int,
	`avgNeuroticism` int,
	`sampleSize` int,
	`dataSource` varchar(255),
	`year` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketBenchmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `miniMentalTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`dataAvaliacao` datetime NOT NULL,
	`orientacaoTemporal` int NOT NULL,
	`orientacaoEspacial` int NOT NULL,
	`memoriaImediata` int NOT NULL,
	`atencaoCalculo` int NOT NULL,
	`evocacao` int NOT NULL,
	`linguagem` int NOT NULL,
	`praxiaConstrutiva` int NOT NULL,
	`pontuacaoTotal` int NOT NULL,
	`classificacao` enum('normal','comprometimento_leve','comprometimento_moderado','comprometimento_grave') NOT NULL,
	`observacoes` text,
	`avaliadorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `miniMentalTests_id` PRIMARY KEY(`id`)
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
CREATE TABLE `notificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queueId` int,
	`ruleId` int,
	`recipientUserId` int,
	`recipientEmail` varchar(320),
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`channel` varchar(50) NOT NULL,
	`status` enum('enviado','falha') NOT NULL,
	`errorMessage` text,
	`opened` boolean NOT NULL DEFAULT false,
	`openedAt` datetime,
	`clicked` boolean NOT NULL DEFAULT false,
	`clickedAt` datetime,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int,
	`triggerEvent` varchar(100) NOT NULL,
	`eventData` text NOT NULL,
	`recipientUserId` int,
	`recipientEmail` varchar(320),
	`recipientName` varchar(255),
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`channel` enum('email','in_app','push') NOT NULL,
	`priority` enum('baixa','normal','alta','urgente') NOT NULL DEFAULT 'normal',
	`status` enum('pendente','processando','enviado','falha','cancelado') NOT NULL DEFAULT 'pendente',
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`lastAttemptAt` datetime,
	`nextAttemptAt` datetime,
	`sentAt` datetime,
	`errorMessage` text,
	`scheduledFor` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`triggerEvent` enum('novo_anexo','mudanca_pir_significativa','mudanca_pir_critica','meta_concluida','meta_atrasada','avaliacao_360_concluida','novo_feedback','competencia_atualizada','pdi_atualizado') NOT NULL,
	`conditions` text NOT NULL,
	`pirChangeThreshold` int,
	`pirChangeDirection` enum('qualquer','melhoria','declinio'),
	`notifyEmployee` boolean NOT NULL DEFAULT false,
	`notifyDirectManager` boolean NOT NULL DEFAULT true,
	`notifyHR` boolean NOT NULL DEFAULT false,
	`notifyCustomEmails` text,
	`sendEmail` boolean NOT NULL DEFAULT true,
	`sendInApp` boolean NOT NULL DEFAULT true,
	`sendPush` boolean NOT NULL DEFAULT false,
	`emailSubjectTemplate` varchar(500),
	`emailBodyTemplate` text,
	`inAppMessageTemplate` text,
	`maxNotificationsPerDay` int NOT NULL DEFAULT 10,
	`cooldownMinutes` int NOT NULL DEFAULT 60,
	`activeFrom` datetime,
	`activeUntil` datetime,
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`eventType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`sendEmail` enum('yes','no') NOT NULL DEFAULT 'no',
	`sendPush` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationTemplates_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `orgChartStructure` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeType` enum('department','position') NOT NULL,
	`departmentId` int,
	`positionId` int,
	`parentId` int,
	`level` int NOT NULL DEFAULT 0,
	`orderIndex` int NOT NULL DEFAULT 0,
	`displayName` varchar(255) NOT NULL,
	`color` varchar(20),
	`icon` varchar(50),
	`positionX` int,
	`positionY` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orgChartStructure_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordChangeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`changedBy` int NOT NULL,
	`changedByName` varchar(255),
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordChangeHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` datetime NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `pdiActionPlan702010` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`practice70Title` varchar(255) NOT NULL DEFAULT '70% - Aprendizado na Prática (On-the-Job)',
	`practice70Items` json DEFAULT ('[]'),
	`social20Title` varchar(255) NOT NULL DEFAULT '20% - Aprendizado com Outros (Social)',
	`social20Items` json DEFAULT ('[]'),
	`formal10Title` varchar(255) NOT NULL DEFAULT '10% - Aprendizado Formal',
	`formal10Items` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiActionPlan702010_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiActionPlan702010_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`axis` enum('70_pratica','20_experiencia','10_educacao') NOT NULL,
	`developmentArea` varchar(100) NOT NULL,
	`successMetric` text NOT NULL,
	`evidenceRequired` text,
	`responsible` varchar(255) NOT NULL,
	`dueDate` datetime NOT NULL,
	`status` enum('nao_iniciado','em_andamento','concluido') NOT NULL DEFAULT 'nao_iniciado',
	`progress` int NOT NULL DEFAULT 0,
	`completedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiCompetencyGaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`competencyId` int NOT NULL,
	`currentLevel` int NOT NULL,
	`targetLevel` int NOT NULL,
	`gap` int NOT NULL,
	`priority` enum('alta','media','baixa') NOT NULL DEFAULT 'media',
	`employeeActions` text,
	`managerActions` text,
	`sponsorActions` text,
	`status` enum('identificado','em_desenvolvimento','superado') NOT NULL DEFAULT 'identificado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiCompetencyGaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiEditHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdiId` int NOT NULL,
	`actionId` int,
	`editType` enum('pdi_update','action_update','action_create','action_delete') NOT NULL,
	`fieldChanged` varchar(100),
	`oldValue` text,
	`newValue` text,
	`editedBy` int NOT NULL,
	`editReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdiEditHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiGovernanceReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`reviewDate` datetime NOT NULL,
	`reviewerId` int NOT NULL,
	`reviewerRole` enum('dgc','mentor','sponsor') NOT NULL,
	`readinessIndexTimes10` int NOT NULL,
	`keyPoints` text NOT NULL,
	`strengths` text,
	`improvements` text,
	`nextSteps` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdiGovernanceReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiImportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileType` enum('xlsx','xls','csv','pdf','html','txt') NOT NULL,
	`fileUrl` varchar(512),
	`status` enum('processando','concluido','erro','parcial') NOT NULL DEFAULT 'processando',
	`totalRecords` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`errorCount` int NOT NULL DEFAULT 0,
	`errors` json,
	`importedBy` int NOT NULL,
	`startedAt` datetime NOT NULL,
	`completedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiImportHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiIntelligentDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`importedFromHtml` boolean NOT NULL DEFAULT false,
	`htmlOriginalPath` varchar(512),
	`htmlContent` text,
	`importedAt` datetime,
	`importedBy` int,
	`strategicContext` text,
	`durationMonths` int NOT NULL DEFAULT 24,
	`mentorId` int,
	`sponsorId1` int,
	`sponsorId2` int,
	`guardianId` int,
	`currentProfile` json,
	`targetProfile` json,
	`gapsAnalysis` json,
	`milestone12Months` text,
	`milestone24Months` text,
	`milestone12Status` enum('pendente','concluido','atrasado') DEFAULT 'pendente',
	`milestone24Status` enum('pendente','concluido','atrasado') DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiIntelligentDetails_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiIntelligentDetails_planId_unique` UNIQUE(`planId`)
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
CREATE TABLE `pdiKpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`currentPosition` varchar(100),
	`reframing` varchar(100),
	`newPosition` varchar(100),
	`performancePlanMonths` int DEFAULT 24,
	`technicalExcellence` varchar(100),
	`leadership` varchar(100),
	`immediateIncentive` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiKpis_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiKpis_planId_unique` UNIQUE(`planId`)
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
CREATE TABLE `pdiRemunerationMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategyId` int NOT NULL,
	`level` varchar(100) NOT NULL,
	`deadline` varchar(100),
	`trigger` text,
	`mechanism` varchar(255),
	`projectedSalary` varchar(100),
	`positionInRange` varchar(100),
	`justification` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiRemunerationMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiRemunerationStrategy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`midpoint` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiRemunerationStrategy_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiRemunerationStrategy_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiResponsibilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`employeeTitle` varchar(255) NOT NULL DEFAULT 'Responsabilidades do Protagonista',
	`employeeResponsibilities` json DEFAULT ('[]'),
	`leadershipTitle` varchar(255) NOT NULL DEFAULT 'Responsabilidades da Liderança',
	`leadershipResponsibilities` json DEFAULT ('[]'),
	`dhoTitle` varchar(255) NOT NULL DEFAULT 'Responsabilidades do DHO (O Guardião)',
	`dhoResponsibilities` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiResponsibilities_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiResponsibilities_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`reviewerRole` enum('mentor','sponsor','guardiao') NOT NULL,
	`reviewDate` datetime NOT NULL,
	`overallProgress` int NOT NULL,
	`strengths` text,
	`improvements` text,
	`nextSteps` text,
	`recommendation` enum('manter','acelerar','ajustar','pausar') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdiReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiRisks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`type` enum('saida','gap_competencia','tempo_preparo','mudanca_estrategica','outro') NOT NULL,
	`description` text NOT NULL,
	`impact` enum('baixo','medio','alto','critico') NOT NULL,
	`probability` enum('baixa','media','alta') NOT NULL,
	`mitigation` text,
	`responsible` int,
	`status` enum('identificado','em_mitigacao','mitigado','materializado') NOT NULL DEFAULT 'identificado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiRisks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdiSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`employeeName` varchar(255),
	`employeeSignedAt` datetime,
	`employeeSignature` varchar(512),
	`sponsorName` varchar(255),
	`sponsorSignedAt` datetime,
	`sponsorSignature` varchar(512),
	`mentorName` varchar(255),
	`mentorSignedAt` datetime,
	`mentorSignature` varchar(512),
	`dhoName` varchar(255),
	`dhoSignedAt` datetime,
	`dhoSignature` varchar(512),
	`allSigned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiSignatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdiSignatures_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE TABLE `pdiTimeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`targetDate` datetime NOT NULL,
	`completedDate` datetime,
	`status` enum('pendente','em_andamento','concluido','atrasado') NOT NULL DEFAULT 'pendente',
	`progress` int NOT NULL DEFAULT 0,
	`notes` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdiTimeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pendencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`status` enum('pendente','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'pendente',
	`prioridade` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`responsavelId` int NOT NULL,
	`criadoPorId` int NOT NULL,
	`dataVencimento` datetime,
	`dataInicio` datetime,
	`dataConclusao` datetime,
	`categoria` varchar(100),
	`tags` text,
	`avaliacaoId` int,
	`metaId` int,
	`pdiId` int,
	`funcionarioId` int,
	`progresso` int DEFAULT 0,
	`observacoes` text,
	`anexos` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pendencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`cycleId` int,
	`alertType` enum('competencia_abaixo_minimo','meta_atrasada','desempenho_geral_baixo','gap_critico','sem_avaliacao') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`title` varchar(255) NOT NULL,
	`description` text,
	`competencyId` int,
	`goalId` int,
	`expectedValue` int,
	`actualValue` int,
	`gapValue` int,
	`status` enum('aberto','em_analise','resolvido','ignorado') NOT NULL DEFAULT 'aberto',
	`resolvedBy` int,
	`resolvedAt` datetime,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceBenchmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scope` enum('organizacao','departamento','cargo') NOT NULL,
	`departmentId` int,
	`positionId` int,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`avgCompetencyScore` int,
	`avgGoalCompletion` int,
	`avgOverallScore` int,
	`p25Score` int,
	`p50Score` int,
	`p75Score` int,
	`p90Score` int,
	`totalEmployees` int NOT NULL,
	`evaluatedEmployees` int NOT NULL,
	`abaixoExpectativas` int DEFAULT 0,
	`atendeExpectativas` int DEFAULT 0,
	`superaExpectativas` int DEFAULT 0,
	`excepcional` int DEFAULT 0,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceBenchmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`goalSubmissionDeadline` date,
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
	`currentValue` varchar(255),
	`submittedAt` timestamp DEFAULT (now()),
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
--> statement-breakpoint
CREATE TABLE `performanceEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('360','180','90') NOT NULL,
	`status` enum('pendente','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'pendente',
	`workflowStatus` enum('pending_self','pending_manager','pending_consensus','completed') NOT NULL DEFAULT 'pending_self',
	`selfEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`managerEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`testsValidated` boolean NOT NULL DEFAULT false,
	`testsValidatedAt` datetime,
	`testsValidatedBy` int,
	`peersEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`subordinatesEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`selfCompletedAt` datetime,
	`managerCompletedAt` datetime,
	`consensusCompletedAt` datetime,
	`selfScore` int,
	`managerScore` int,
	`finalScore` int,
	`managerComments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `performanceEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`evaluationId` int NOT NULL,
	`score` int NOT NULL,
	`rating` enum('insatisfatorio','abaixo_expectativas','atende_expectativas','supera_expectativas','excepcional') NOT NULL,
	`evaluationDate` datetime NOT NULL,
	`evaluationType` varchar(50) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int,
	`departmentId` int,
	`positionId` int,
	`periodYear` int NOT NULL,
	`periodMonth` int,
	`totalEvaluations` int NOT NULL DEFAULT 0,
	`completedEvaluations` int NOT NULL DEFAULT 0,
	`pendingEvaluations` int NOT NULL DEFAULT 0,
	`averageScore` int,
	`averageRating` enum('insatisfatorio','abaixo_expectativas','atende_expectativas','supera_expectativas','excepcional'),
	`totalGoals` int NOT NULL DEFAULT 0,
	`completedGoals` int NOT NULL DEFAULT 0,
	`goalCompletionRate` int,
	`averageCompetencyScore` int,
	`topCompetency` varchar(200),
	`improvementArea` varchar(200),
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissionAccessLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userEmail` varchar(320),
	`userName` text,
	`action` varchar(200) NOT NULL,
	`resource` varchar(200) NOT NULL,
	`resourceId` int,
	`accessGranted` boolean NOT NULL,
	`denialReason` text,
	`requiredPermissions` json,
	`userPermissions` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`requestPath` text,
	`requestMethod` varchar(10),
	`metadata` json,
	`riskLevel` enum('baixo','medio','alto','critico') DEFAULT 'baixo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissionAccessLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissionChangeRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetUserId` int NOT NULL,
	`targetUserName` varchar(255),
	`changeType` enum('add_profile','remove_profile','change_profile') NOT NULL,
	`currentProfileId` int,
	`requestedProfileId` int NOT NULL,
	`reason` text NOT NULL,
	`businessJustification` text,
	`requestedBy` int NOT NULL,
	`requestedByName` varchar(255),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedByName` varchar(255),
	`approvedAt` datetime,
	`approvalComments` text,
	`implementedBy` int,
	`implementedAt` datetime,
	`expiresAt` datetime,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	CONSTRAINT `permissionChangeRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resource` varchar(100) NOT NULL,
	`action` varchar(50) NOT NULL,
	`description` text,
	`category` varchar(100),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`recordedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`totalParticipants` int NOT NULL DEFAULT 0,
	`activeParticipants` int NOT NULL DEFAULT 0,
	`completedParticipants` int NOT NULL DEFAULT 0,
	`averageProgress` int NOT NULL DEFAULT 0,
	`averageTimeSpent` int NOT NULL DEFAULT 0,
	`averageScore` int,
	`alertsCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilotMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`employeeId` int NOT NULL,
	`status` enum('invited','accepted','in_training','ready','in_progress','completed','declined','removed') NOT NULL DEFAULT 'invited',
	`trainingCompletedAt` datetime,
	`assessmentStartedAt` datetime,
	`assessmentCompletedAt` datetime,
	`overallScore` int,
	`feedbackNotes` text,
	`invitedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`respondedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`plannedStartDate` datetime NOT NULL,
	`plannedEndDate` datetime NOT NULL,
	`actualStartDate` datetime,
	`actualEndDate` datetime,
	`status` enum('pending','in_progress','completed','delayed','cancelled') NOT NULL DEFAULT 'pending',
	`responsibleUserId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotSchedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotSimulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetParticipants` int NOT NULL DEFAULT 30,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`phase` enum('preparation','training','execution','analysis','adjustment','completed') NOT NULL DEFAULT 'preparation',
	`status` enum('draft','active','paused','completed','cancelled') NOT NULL DEFAULT 'draft',
	`completionRate` int DEFAULT 0,
	`averageScore` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotSimulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`questionId` int NOT NULL,
	`answerText` text,
	`answerOption` varchar(255),
	`answerScale` int,
	`answerBoolean` boolean,
	`answeredAt` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`cycleId` int,
	`assessmentDate` datetime NOT NULL,
	`status` enum('pendente','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'pendente',
	`videoUrl` varchar(512),
	`videoKey` varchar(512),
	`videoDuration` int,
	`videoRecordedAt` datetime,
	`overallScore` int,
	`comments` text,
	`evaluatorId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` datetime,
	CONSTRAINT `pirAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirConsolidatedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportType` enum('department','position','team','company') NOT NULL,
	`departmentId` int,
	`positionId` int,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`totalAssessments` int NOT NULL,
	`averageOverallScore` int,
	`averageIntegrityScore` int,
	`averageEthicsScore` int,
	`scoreDistribution` json,
	`trends` json,
	`departmentComparisons` json,
	`positionComparisons` json,
	`keyInsights` json,
	`recommendations` json,
	`reportPdfUrl` varchar(512),
	`reportPdfS3Key` varchar(512),
	`generatedBy` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirConsolidatedReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirDetailedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`behavioralProfileScore` int,
	`integrityScore` int,
	`ethicsScore` int,
	`videoAnalysisScore` int,
	`overallScore` int,
	`dominantDimension` varchar(50),
	`dimensionScores` json,
	`integrityIndicators` json,
	`ethicsIndicators` json,
	`consistencyAnalysis` json,
	`videoAnalysisSummary` json,
	`criticalMarkers` json,
	`positionId` int,
	`positionTitle` varchar(255),
	`fitScore` int,
	`fitAnalysis` json,
	`culturalFitScore` int,
	`culturalFitAnalysis` json,
	`strengths` json,
	`developmentAreas` json,
	`developmentSuggestions` json,
	`hiringRecommendation` enum('highly_recommended','recommended','recommended_with_reservations','not_recommended','strongly_not_recommended'),
	`recommendationRationale` text,
	`alerts` json,
	`redFlags` json,
	`reportPdfUrl` varchar(512),
	`reportPdfS3Key` varchar(512),
	`generatedBy` int,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirDetailedReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `pirDetailedReports_pirAssessmentId_unique` UNIQUE(`pirAssessmentId`)
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
CREATE TABLE `pirIntegrityAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`assessmentType` enum('hiring','periodic','promotion','investigation') NOT NULL,
	`status` enum('draft','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`startedAt` datetime,
	`completedAt` datetime,
	`overallScore` int,
	`riskLevel` enum('low','moderate','high','critical'),
	`moralLevel` enum('pre_conventional','conventional','post_conventional'),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityDevelopmentPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`dimensionId` int,
	`actionTitle` varchar(255) NOT NULL,
	`actionDescription` text,
	`targetDate` date,
	`status` enum('pendente','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'pendente',
	`progress` int DEFAULT 0,
	`completedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityDevelopmentPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityDimensionScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`dimensionId` int NOT NULL,
	`score` int NOT NULL,
	`riskLevel` enum('low','moderate','high','critical'),
	`strengths` json,
	`weaknesses` json,
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirIntegrityDimensionScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityDimensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`weight` int NOT NULL DEFAULT 100,
	`displayOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityDimensions_id` PRIMARY KEY(`id`),
	CONSTRAINT `pirIntegrityDimensions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
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
CREATE TABLE `pirIntegrityQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dimensionId` int NOT NULL,
	`questionType` enum('scenario','multiple_choice','scale','open_ended') NOT NULL,
	`title` varchar(255) NOT NULL,
	`scenario` text,
	`question` text NOT NULL,
	`options` json,
	`scaleMin` int,
	`scaleMax` int,
	`scaleLabels` json,
	`requiresJustification` boolean NOT NULL DEFAULT false,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`displayOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`videoUrl` varchar(512),
	`videoThumbnailUrl` varchar(512),
	`videoDuration` int,
	`requiresVideoWatch` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`reportType` enum('individual','team','department','executive') NOT NULL,
	`executiveSummary` text,
	`detailedAnalysis` json,
	`recommendations` json,
	`generatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirIntegrityReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedOption` varchar(10),
	`scaleValue` int,
	`openResponse` text,
	`justification` text,
	`timeSpent` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirIntegrityResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirIntegrityRiskIndicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`indicatorType` varchar(50) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text,
	`detectedAt` datetime,
	`resolvedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pirIntegrityRiskIndicators_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `pirInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int,
	`candidateEmail` varchar(320),
	`candidateName` varchar(255),
	`candidatePhone` varchar(50),
	`token` varchar(255) NOT NULL,
	`status` enum('pending','sent','in_progress','completed','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` datetime NOT NULL,
	`sentAt` datetime,
	`startedAt` datetime,
	`completedAt` datetime,
	`pirAssessmentId` int,
	`createdBy` int NOT NULL,
	`createdByName` varchar(255),
	`purpose` varchar(255),
	`notes` text,
	`savedAnswers` text,
	`lastActivityAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pirInvitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `pirQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`questionText` text NOT NULL,
	`questionType` enum('texto','multipla_escolha','escala','sim_nao') NOT NULL,
	`questionCategory` varchar(100),
	`options` json,
	`scaleMin` int,
	`scaleMax` int,
	`scaleLabels` json,
	`required` boolean NOT NULL DEFAULT true,
	`order` int DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pirQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pirVideoRecordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`videoUrl` varchar(512) NOT NULL,
	`videoS3Key` varchar(512) NOT NULL,
	`duration` int,
	`fileSize` int,
	`format` varchar(50),
	`resolution` varchar(50),
	`processingStatus` enum('uploaded','processing','completed','failed') NOT NULL DEFAULT 'uploaded',
	`questionTimestamps` json,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` datetime,
	CONSTRAINT `pirVideoRecordings_id` PRIMARY KEY(`id`)
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
	`salaryMin` int,
	`salaryMax` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `positions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `processEvaluationComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int,
	`participantId` int,
	`evaluatorId` int NOT NULL,
	`questionId` int,
	`sectionId` int,
	`comment` text NOT NULL,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processEvaluationComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processEvaluators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluatorType` enum('self','manager','peer','subordinate') NOT NULL,
	`status` enum('pendente','em_andamento','concluido') NOT NULL DEFAULT 'pendente',
	`score` int,
	`comments` text,
	`notifiedAt` datetime,
	`startedAt` datetime,
	`completedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processEvaluators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`employeeId` int NOT NULL,
	`status` enum('pendente','em_andamento','concluido') NOT NULL DEFAULT 'pendente',
	`selfEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`managerEvaluationCompleted` boolean NOT NULL DEFAULT false,
	`peerEvaluationsCompleted` int DEFAULT 0,
	`subordinateEvaluationsCompleted` int DEFAULT 0,
	`selfScore` int,
	`managerScore` int,
	`peerAverageScore` int,
	`subordinateAverageScore` int,
	`finalScore` int,
	`startedAt` datetime,
	`completedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profilePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`permissionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profilePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`level` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `psychometricTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`testType` enum('disc','bigfive','mbti','ie','vark','leadership','careeranchors','pir') NOT NULL,
	`completedAt` datetime NOT NULL,
	`discDominance` int,
	`discInfluence` int,
	`discSteadiness` int,
	`discCompliance` int,
	`discProfile` varchar(10),
	`bigFiveOpenness` int,
	`bigFiveConscientiousness` int,
	`bigFiveExtraversion` int,
	`bigFiveAgreeableness` int,
	`bigFiveNeuroticism` int,
	`responses` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `psychometricTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `pulseSurveyResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`employeeId` int,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `pulseSurveyResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pulseSurveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`description` text,
	`status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
	`targetDepartmentId` int,
	`targetEmployeeIds` json,
	`targetGroups` json,
	`targetDepartmentIds` json,
	`targetCostCenterIds` json,
	`targetEmails` json,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`activatedAt` datetime,
	`closedAt` datetime,
	CONSTRAINT `pulseSurveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushNotificationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`actionUrl` varchar(500),
	`deviceType` enum('desktop','mobile','tablet') DEFAULT 'desktop',
	`status` enum('sent','opened','failed') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`openedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushNotificationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`p256dh` varchar(200) NOT NULL,
	`auth` varchar(100) NOT NULL,
	`userAgent` varchar(500),
	`deviceType` enum('desktop','mobile','tablet') DEFAULT 'desktop',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int,
	`reportName` varchar(255),
	`action` enum('view','export_pdf','export_excel','create','update','delete') NOT NULL,
	`userId` int NOT NULL,
	`metrics` json,
	`filters` json,
	`executionTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportExecutionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduledReportId` int NOT NULL,
	`executedAt` datetime NOT NULL,
	`status` enum('success','failed','partial') NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`executionTimeMs` int,
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportExecutionLogs_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `reportExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int,
	`processId` int,
	`exportType` enum('pdf','excel','csv','json') NOT NULL,
	`fileUrl` varchar(512),
	`status` enum('processando','concluido','falhou') NOT NULL DEFAULT 'processando',
	`exportedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`reportType` enum('individual','departamento','consolidado','comparativo','ranking') NOT NULL,
	`config` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`allowedRoles` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `responsePatternAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`consistencyScore` int,
	`inconsistentResponsesCount` int NOT NULL DEFAULT 0,
	`socialDesirabilityScore` int,
	`socialDesirableResponsesCount` int NOT NULL DEFAULT 0,
	`averageResponseTime` int,
	`tooFastResponsesCount` int NOT NULL DEFAULT 0,
	`tooSlowResponsesCount` int NOT NULL DEFAULT 0,
	`patternsDetected` json,
	`hasInconsistencies` boolean NOT NULL DEFAULT false,
	`hasSocialDesirability` boolean NOT NULL DEFAULT false,
	`hasAnomalousTimings` boolean NOT NULL DEFAULT false,
	`reliabilityScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `responsePatternAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledEmails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`recipientUserId` int,
	`templateData` json NOT NULL,
	`scheduledFor` datetime NOT NULL,
	`status` enum('pending','sending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`lastAttemptAt` datetime,
	`sentAt` datetime,
	`errorMessage` text,
	`trackingId` varchar(100),
	`opened` boolean NOT NULL DEFAULT false,
	`openedAt` datetime,
	`clicked` boolean NOT NULL DEFAULT false,
	`clickedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledEmails_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduledEmails_trackingId_unique` UNIQUE(`trackingId`)
);
--> statement-breakpoint
CREATE TABLE `scheduledReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportType` enum('nine_box','performance','pdi','evaluations','goals','competencies','succession','turnover','headcount') NOT NULL,
	`reportName` varchar(255) NOT NULL,
	`frequency` enum('daily','weekly','monthly','quarterly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`hour` int NOT NULL DEFAULT 9,
	`recipients` text NOT NULL,
	`departments` text,
	`format` enum('pdf','excel','csv') NOT NULL DEFAULT 'pdf',
	`includeCharts` boolean NOT NULL DEFAULT true,
	`active` boolean NOT NULL DEFAULT true,
	`lastExecutedAt` datetime,
	`nextExecutionAt` datetime,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`totalAccessAttempts` int NOT NULL DEFAULT 0,
	`successfulAccesses` int NOT NULL DEFAULT 0,
	`deniedAccesses` int NOT NULL DEFAULT 0,
	`lowRiskCount` int NOT NULL DEFAULT 0,
	`mediumRiskCount` int NOT NULL DEFAULT 0,
	`highRiskCount` int NOT NULL DEFAULT 0,
	`criticalRiskCount` int NOT NULL DEFAULT 0,
	`uniqueUsers` int NOT NULL DEFAULT 0,
	`suspiciousUsers` int NOT NULL DEFAULT 0,
	`topResources` json,
	`topActions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int,
	`departmentId` int,
	`cycleId` int NOT NULL,
	`pdiPlanId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`type` enum('individual','team','organizational') NOT NULL,
	`goalType` enum('individual','corporate') NOT NULL DEFAULT 'individual',
	`category` enum('financial','behavioral','corporate','development') NOT NULL,
	`isSpecific` boolean NOT NULL DEFAULT false,
	`isMeasurable` boolean NOT NULL DEFAULT false,
	`isAchievable` boolean NOT NULL DEFAULT false,
	`isRelevant` boolean NOT NULL DEFAULT false,
	`isTimeBound` boolean NOT NULL DEFAULT false,
	`measurementUnit` varchar(50),
	`targetValueCents` int,
	`currentValueCents` int DEFAULT 0,
	`weight` int NOT NULL DEFAULT 10,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`bonusEligible` boolean NOT NULL DEFAULT false,
	`bonusPercentage` int,
	`bonusAmountCents` int,
	`status` enum('draft','pending_approval','approved','rejected','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`approvalStatus` enum('not_submitted','pending_manager','pending_hr','approved','rejected') NOT NULL DEFAULT 'not_submitted',
	`progress` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `smartGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smtp_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`host` varchar(255) NOT NULL,
	`port` int NOT NULL DEFAULT 587,
	`secure` boolean DEFAULT false,
	`user` varchar(255) NOT NULL,
	`password` text NOT NULL,
	`from_email` varchar(320) NOT NULL,
	`from_name` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smtp_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successionCandidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`employeeId` int NOT NULL,
	`readinessLevel` enum('imediato','1_ano','2_3_anos','mais_3_anos') NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`performance` enum('baixo','medio','alto') NOT NULL,
	`potential` enum('baixo','medio','alto') NOT NULL,
	`gapAnalysis` text,
	`developmentActions` text,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successionCandidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`candidateId` int,
	`userId` int NOT NULL,
	`actionType` enum('plan_created','plan_updated','plan_deleted','candidate_added','candidate_updated','candidate_removed','risk_updated','timeline_updated','development_updated','test_sent') NOT NULL,
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `successionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`currentHolderId` int,
	`isCritical` boolean NOT NULL DEFAULT false,
	`riskLevel` enum('baixo','medio','alto','critico') NOT NULL DEFAULT 'medio',
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`exitRisk` enum('baixo','medio','alto') DEFAULT 'medio',
	`competencyGap` text,
	`preparationTime` int,
	`trackingPlan` text,
	`nextReviewDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`description` text,
	`isEncrypted` boolean NOT NULL DEFAULT false,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `templateCriteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`criteriaId` int NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`isRequired` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateCriteria_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `temporalAnalysisConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`analysisType` enum('individual','comparativa','departamento','organizacional') NOT NULL,
	`periodType` enum('mensal','trimestral','semestral','anual','customizado') NOT NULL,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`employeeIds` text,
	`departmentIds` text,
	`includeAllActive` boolean NOT NULL DEFAULT false,
	`metricsToAnalyze` text NOT NULL,
	`includeGoals` boolean NOT NULL DEFAULT true,
	`includePir` boolean NOT NULL DEFAULT true,
	`include360` boolean NOT NULL DEFAULT true,
	`includeCompetencies` boolean NOT NULL DEFAULT true,
	`compareWithPreviousPeriod` boolean NOT NULL DEFAULT true,
	`compareWithDepartmentAvg` boolean NOT NULL DEFAULT true,
	`compareWithOrgAvg` boolean NOT NULL DEFAULT true,
	`significantChangeThreshold` int NOT NULL DEFAULT 15,
	`criticalChangeThreshold` int NOT NULL DEFAULT 30,
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `temporalAnalysisConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `temporalAnalysisResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`analysisDate` datetime NOT NULL,
	`periodLabel` varchar(100) NOT NULL,
	`totalEmployeesAnalyzed` int NOT NULL,
	`averagePirScore` int,
	`averageGoalCompletion` int,
	`average360Score` int,
	`trendsData` text NOT NULL,
	`significantChanges` text,
	`topPerformers` text,
	`needsAttention` text,
	`previousPeriodComparison` text,
	`departmentComparison` text,
	`organizationalComparison` text,
	`improvementRate` int,
	`declineRate` int,
	`stableRate` int,
	`insights` text,
	`recommendations` text,
	`status` enum('processando','concluido','erro') NOT NULL DEFAULT 'processando',
	`errorMessage` text,
	`generatedBy` int,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`processingTimeSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `temporalAnalysisResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int,
	`testType` enum('disc','bigfive','mbti','ie','vark','leadership','careeranchors','pir') NOT NULL,
	`isExternalCandidate` boolean NOT NULL DEFAULT false,
	`candidateName` varchar(255),
	`candidateEmail` varchar(320),
	`uniqueToken` varchar(128) NOT NULL,
	`status` enum('pendente','em_andamento','concluido','expirado') NOT NULL DEFAULT 'pendente',
	`sentAt` datetime NOT NULL,
	`expiresAt` datetime NOT NULL,
	`startedAt` datetime,
	`completedAt` datetime,
	`emailSent` boolean NOT NULL DEFAULT false,
	`emailSentAt` datetime,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `testInvitations_uniqueToken_unique` UNIQUE(`uniqueToken`)
);
--> statement-breakpoint
CREATE TABLE `testQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testType` enum('disc','bigfive','mbti','ie','vark','leadership','careeranchors','pir') NOT NULL,
	`questionNumber` int NOT NULL,
	`questionText` text NOT NULL,
	`dimension` varchar(50) NOT NULL,
	`reverse` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` int NOT NULL,
	`questionId` int NOT NULL,
	`answer` int NOT NULL,
	`responseTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` int NOT NULL,
	`employeeId` int,
	`testType` enum('disc','bigfive','mbti','ie','vark','leadership','careeranchors','pir') NOT NULL,
	`scores` text NOT NULL,
	`profileType` varchar(50),
	`profileDescription` text,
	`strengths` text,
	`developmentAreas` text,
	`workStyle` text,
	`communicationStyle` text,
	`leadershipStyle` text,
	`motivators` text,
	`stressors` text,
	`teamContribution` text,
	`careerRecommendations` text,
	`rawData` text,
	`validationStatus` enum('pendente','aprovado','reprovado') NOT NULL DEFAULT 'pendente',
	`validatedBy` int,
	`validatedAt` datetime,
	`validationComments` text,
	`completedAt` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trendAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trendType` enum('performance_evolution','competency_growth','gap_reduction','pdi_effectiveness','assessment_participation') NOT NULL,
	`departmentId` int,
	`employeeId` int,
	`competencyId` int,
	`timeSeriesData` json NOT NULL,
	`trend` enum('increasing','stable','decreasing'),
	`trendStrength` int,
	`projectedValue` int,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trendAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userNotificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notifyNewAttachment` boolean NOT NULL DEFAULT true,
	`notifyPirChanges` boolean NOT NULL DEFAULT true,
	`notifyGoalUpdates` boolean NOT NULL DEFAULT true,
	`notify360Completion` boolean NOT NULL DEFAULT true,
	`notifyFeedback` boolean NOT NULL DEFAULT true,
	`notifyPdiUpdates` boolean NOT NULL DEFAULT true,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`pushEnabled` boolean NOT NULL DEFAULT false,
	`quietHoursEnabled` boolean NOT NULL DEFAULT false,
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`digestMode` boolean NOT NULL DEFAULT false,
	`digestFrequency` enum('diario','semanal'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userNotificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userNotificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enableProcessStart` boolean NOT NULL DEFAULT true,
	`enableStepCompleted` boolean NOT NULL DEFAULT true,
	`enableStepReminder` boolean NOT NULL DEFAULT true,
	`enableGoalUpdate` boolean NOT NULL DEFAULT true,
	`enableEvaluationRequest` boolean NOT NULL DEFAULT true,
	`enablePdiUpdate` boolean NOT NULL DEFAULT true,
	`enableBonusNotification` boolean NOT NULL DEFAULT true,
	`enableApprovalRequest` boolean NOT NULL DEFAULT true,
	`enableSystemAlert` boolean NOT NULL DEFAULT true,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`pushEnabled` boolean NOT NULL DEFAULT false,
	`dailyDigest` boolean NOT NULL DEFAULT false,
	`weeklyDigest` boolean NOT NULL DEFAULT false,
	`preferredTimeStart` varchar(5) DEFAULT '08:00',
	`preferredTimeEnd` varchar(5) DEFAULT '18:00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userNotificationSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedBy` int,
	`revokedAt` datetime,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verbalBehaviorAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoRecordingId` int NOT NULL,
	`questionId` int,
	`transcription` text,
	`tonePitch` varchar(50),
	`toneVariation` int,
	`speakingRate` int,
	`pauseCount` int NOT NULL DEFAULT 0,
	`averagePauseDuration` int,
	`longestPause` int,
	`hesitationCount` int NOT NULL DEFAULT 0,
	`fillerWordsCount` int NOT NULL DEFAULT 0,
	`emotionalTone` enum('neutral','positive','negative','anxious','confident'),
	`analysisConfidence` int,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verbalBehaviorAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`faceValidationStatus` enum('pendente','validado','falhou','sem_perfil','multiplas_faces','face_nao_detectada') NOT NULL DEFAULT 'pendente',
	`faceMatchScore` int,
	`faceValidationTimestamp` datetime,
	`faceValidationDetails` text,
	`eyeContactScore` int,
	`confidenceScore` int,
	`clarityScore` int,
	`enthusiasmScore` int,
	`transcription` text,
	`keyPoints` text,
	`sentimentAnalysis` text,
	`competenciesDetected` text,
	`strengthsIdentified` text,
	`areasForImprovement` text,
	`overallScore` int,
	`aiConfidence` int,
	`analysisStatus` enum('pendente','processando','concluida','erro','cancelada') NOT NULL DEFAULT 'pendente',
	`errorMessage` text,
	`notificationSent` boolean NOT NULL DEFAULT false,
	`notificationSentAt` datetime,
	`notifiedUsers` text,
	`analyzedBy` int,
	`analyzedAt` datetime,
	`processingTimeSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoAnalysisHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`analysisId` int NOT NULL,
	`snapshotDate` datetime NOT NULL,
	`overallScore` int,
	`eyeContactScore` int,
	`confidenceScore` int,
	`clarityScore` int,
	`enthusiasmScore` int,
	`competenciesSnapshot` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoAnalysisHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoAnalysisReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`videoRecordingId` int NOT NULL,
	`overallBehaviorScore` int,
	`facialExpressionScore` int,
	`bodyLanguageScore` int,
	`verbalBehaviorScore` int,
	`deceptionIndicators` json,
	`stressIndicators` json,
	`inconsistencyIndicators` json,
	`totalMicroExpressions` int NOT NULL DEFAULT 0,
	`totalMarkers` int NOT NULL DEFAULT 0,
	`criticalMarkersCount` int NOT NULL DEFAULT 0,
	`executiveSummary` text,
	`recommendations` json,
	`analysisReliability` int,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoAnalysisReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoMarkers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoRecordingId` int NOT NULL,
	`timestamp` int NOT NULL,
	`markerType` enum('inconsistency','high_stress','deception_indicator','confidence_peak','notable_expression','manual_note') NOT NULL,
	`description` text,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`isAutomatic` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoMarkers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoMetadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pirAssessmentId` int NOT NULL,
	`facesDetected` boolean NOT NULL DEFAULT false,
	`multipleFacesDetected` boolean NOT NULL DEFAULT false,
	`noFaceDetected` boolean NOT NULL DEFAULT false,
	`personChanged` boolean NOT NULL DEFAULT false,
	`totalFramesAnalyzed` int DEFAULT 0,
	`framesWithFace` int DEFAULT 0,
	`framesWithMultipleFaces` int DEFAULT 0,
	`framesWithNoFace` int DEFAULT 0,
	`multipleFacesTimestamps` json,
	`noFaceTimestamps` json,
	`personChangeTimestamps` json,
	`faceDescriptors` json,
	`validationPassed` boolean NOT NULL DEFAULT false,
	`validationScore` int,
	`validationNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoMetadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `workflowInstances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowStepApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`approverId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	CONSTRAINT `workflowStepApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('aprovacao_metas','aprovacao_pdi','aprovacao_avaliacao','aprovacao_bonus','aprovacao_ferias','aprovacao_promocao','aprovacao_horas_extras','aprovacao_despesas','outro') NOT NULL,
	`steps` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('low_productivity','inconsistent_hours','low_diversity','missing_activities','time_discrepancy','goal_overdue','evaluation_pending') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`metrics` text,
	`status` enum('active','resolved','dismissed') NOT NULL DEFAULT 'active',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	`actionTaken` enum('email_sent','meeting_scheduled','warning_issued','training_assigned','none'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeClockRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` timestamp NOT NULL,
	`clockIn` timestamp,
	`clockOut` timestamp,
	`totalMinutes` int,
	`breakMinutes` int DEFAULT 0,
	`workedMinutes` int,
	`recordType` enum('normal','overtime','absence','late','early_leave','holiday') NOT NULL DEFAULT 'normal',
	`location` varchar(255),
	`notes` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`importSource` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeClockRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeDiscrepancies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` timestamp NOT NULL,
	`clockMinutes` int NOT NULL,
	`activityMinutes` int NOT NULL,
	`differenceMinutes` int NOT NULL,
	`differencePercentage` decimal(5,2),
	`discrepancyType` enum('over_reported','under_reported','acceptable') NOT NULL,
	`status` enum('pending','reviewed','justified','flagged') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`justification` text,
	`alertId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeDiscrepancies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activitySuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`suggestedTitle` varchar(255) NOT NULL,
	`suggestedDescription` text,
	`suggestedCategory` varchar(100),
	`detectedStartTime` datetime NOT NULL,
	`detectedEndTime` datetime NOT NULL,
	`detectedDurationMinutes` int NOT NULL,
	`confidenceScore` int NOT NULL DEFAULT 50,
	`patterns` text,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`acceptedAt` datetime,
	`rejectedAt` datetime,
	`createdActivityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` datetime NOT NULL,
	CONSTRAINT `activitySuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manualActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`startTime` datetime NOT NULL,
	`endTime` datetime,
	`durationMinutes` int NOT NULL,
	`source` enum('manual','suggestion_accepted','imported') NOT NULL DEFAULT 'manual',
	`suggestionId` int,
	`tags` text,
	`projectId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manualActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productivityGoalProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`userId` int NOT NULL,
	`periodType` enum('daily','weekly','monthly') NOT NULL,
	`periodDate` date NOT NULL,
	`actualValue` int NOT NULL,
	`targetValue` int NOT NULL,
	`achievementPercentage` int NOT NULL,
	`status` enum('below_target','on_target','above_target') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productivityGoalProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productivityGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('individual','team','department') NOT NULL,
	`targetUserId` int,
	`targetTeamId` int,
	`targetDepartmentId` int,
	`goalType` enum('daily_active_hours','weekly_active_hours','monthly_active_hours','productivity_score') NOT NULL,
	`targetValue` int NOT NULL,
	`unit` varchar(50) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`creatorName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productivityGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeTrackingSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startTime` datetime NOT NULL,
	`endTime` datetime NOT NULL,
	`activeMinutes` int NOT NULL DEFAULT 0,
	`idleMinutes` int NOT NULL DEFAULT 0,
	`productivityScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeTrackingSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','rh','gestor','colaborador') NOT NULL DEFAULT 'colaborador';--> statement-breakpoint
ALTER TABLE `users` ADD `isSalaryLead` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_resolvedBy_employees_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeClockRecords` ADD CONSTRAINT `timeClockRecords_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeDiscrepancies` ADD CONSTRAINT `timeDiscrepancies_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeDiscrepancies` ADD CONSTRAINT `timeDiscrepancies_reviewedBy_employees_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeDiscrepancies` ADD CONSTRAINT `timeDiscrepancies_alertId_alerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `alerts`(`id`) ON DELETE no action ON UPDATE no action;