-- Tabelas do Módulo OKRs

CREATE TABLE IF NOT EXISTS `objectives` (
  `id` int AUTO_INCREMENT NOT NULL,
  `parentId` int,
  `level` enum('company','department','team','individual') NOT NULL,
  `departmentId` int,
  `employeeId` int,
  `title` varchar(255) NOT NULL,
  `description` text,
  `startDate` timestamp NOT NULL,
  `endDate` timestamp NOT NULL,
  `quarter` int,
  `year` int NOT NULL,
  `status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
  `progress` int NOT NULL DEFAULT 0,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `objectives_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `keyResults` (
  `id` int AUTO_INCREMENT NOT NULL,
  `objectiveId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `metricType` enum('number','percentage','currency','boolean') NOT NULL,
  `startValue` int NOT NULL DEFAULT 0,
  `targetValue` int NOT NULL,
  `currentValue` int NOT NULL DEFAULT 0,
  `unit` varchar(50),
  `progress` int NOT NULL DEFAULT 0,
  `status` enum('not_started','on_track','at_risk','behind','completed') NOT NULL DEFAULT 'not_started',
  `weight` int NOT NULL DEFAULT 100,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `keyResults_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `okrCheckIns` (
  `id` int AUTO_INCREMENT NOT NULL,
  `objectiveId` int,
  `keyResultId` int,
  `previousValue` int,
  `currentValue` int NOT NULL,
  `progress` int NOT NULL,
  `status` enum('on_track','at_risk','behind') NOT NULL,
  `confidence` enum('low','medium','high') DEFAULT 'medium',
  `comment` text,
  `blockers` text,
  `nextSteps` text,
  `checkInDate` timestamp NOT NULL,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `okrCheckIns_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `okrAlignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `parentObjectiveId` int NOT NULL,
  `childObjectiveId` int NOT NULL,
  `alignmentType` enum('supports','contributes_to','depends_on') NOT NULL,
  `contributionWeight` int NOT NULL DEFAULT 100,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `okrAlignments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `okrHistory` (
  `id` int AUTO_INCREMENT NOT NULL,
  `objectiveId` int,
  `keyResultId` int,
  `changeType` enum('created','updated','progress_updated','status_changed','completed','cancelled') NOT NULL,
  `fieldChanged` varchar(100),
  `oldValue` text,
  `newValue` text,
  `changedBy` int NOT NULL,
  `changedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `comment` text,
  CONSTRAINT `okrHistory_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `okrTemplates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100),
  `objectiveTemplate` text NOT NULL,
  `keyResultsTemplate` text NOT NULL,
  `level` enum('company','department','team','individual') NOT NULL,
  `recommendedDuration` int,
  `isPublic` boolean NOT NULL DEFAULT true,
  `usageCount` int NOT NULL DEFAULT 0,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `okrTemplates_id` PRIMARY KEY(`id`)
);

-- Tabelas do Módulo Clima Organizacional

CREATE TABLE IF NOT EXISTS `climateSurveys` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `startDate` timestamp NOT NULL,
  `endDate` timestamp NOT NULL,
  `status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
  `isAnonymous` boolean NOT NULL DEFAULT true,
  `allowMultipleResponses` boolean NOT NULL DEFAULT false,
  `targetDepartments` json,
  `targetEmployees` json,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `climateSurveys_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `climateDimensions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(50),
  `color` varchar(20),
  `displayOrder` int NOT NULL DEFAULT 0,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `climateDimensions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `climateQuestions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `dimensionId` int NOT NULL,
  `questionText` text NOT NULL,
  `questionType` enum('scale','multiple_choice','text','yes_no') NOT NULL,
  `options` json,
  `scaleMin` int NOT NULL DEFAULT 1,
  `scaleMax` int NOT NULL DEFAULT 5,
  `scaleMinLabel` varchar(100),
  `scaleMaxLabel` varchar(100),
  `isRequired` boolean NOT NULL DEFAULT true,
  `displayOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `climateQuestions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `climateResponses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `questionId` int NOT NULL,
  `responseToken` varchar(64) NOT NULL,
  `departmentId` int,
  `hierarchyLevel` varchar(50),
  `tenureRange` varchar(50),
  `responseValue` int,
  `responseText` text,
  `submittedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `climateResponses_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `climateResults` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `dimensionId` int NOT NULL,
  `departmentId` int,
  `hierarchyLevel` varchar(50),
  `averageScore` int,
  `responseCount` int NOT NULL,
  `participationRate` int,
  `scoreDistribution` json,
  `trend` enum('improving','stable','declining'),
  `previousScore` int,
  `calculatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `climateResults_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `climateInsights` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `dimensionId` int,
  `departmentId` int,
  `insightType` enum('strength','concern','opportunity','recommendation') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `suggestedActions` json,
  `status` enum('new','acknowledged','in_progress','completed') NOT NULL DEFAULT 'new',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `climateInsights_id` PRIMARY KEY(`id`)
);
