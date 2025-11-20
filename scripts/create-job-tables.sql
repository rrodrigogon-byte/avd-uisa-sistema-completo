CREATE TABLE IF NOT EXISTS `jobDescriptions` (
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
  `createdById` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approvedAt` datetime,
  CONSTRAINT `jobDescriptions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `jobResponsibilities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobDescriptionId` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `displayOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `jobResponsibilities_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `jobKnowledge` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobDescriptionId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `level` enum('basico','intermediario','avancado','obrigatorio') NOT NULL,
  `displayOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `jobKnowledge_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `jobCompetencies` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobDescriptionId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('competencia','habilidade') NOT NULL DEFAULT 'competencia',
  `displayOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `jobCompetencies_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `jobDescriptionApprovals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobDescriptionId` int NOT NULL,
  `approvalLevel` enum('occupant','manager','hr') NOT NULL,
  `approverId` int NOT NULL,
  `approverName` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `comments` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `decidedAt` datetime,
  CONSTRAINT `jobDescriptionApprovals_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `employeeActivities` (
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `employeeActivities_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `activityLogs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `employeeId` int NOT NULL,
  `userId` int NOT NULL,
  `activityType` varchar(100) NOT NULL,
  `activityDescription` varchar(500),
  `entityType` varchar(100),
  `entityId` int,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
