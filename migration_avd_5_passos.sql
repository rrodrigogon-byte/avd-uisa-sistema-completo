-- ============================================================================
-- SISTEMA AVD UISA - FLUXO DE AVALIAÇÃO EM 5 PASSOS
-- ============================================================================

-- Tabela de Processos de Avaliação AVD
CREATE TABLE IF NOT EXISTS `avdAssessmentProcesses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employeeId` INT NOT NULL,
  `status` ENUM('em_andamento', 'concluido', 'cancelado') DEFAULT 'em_andamento' NOT NULL,
  `currentStep` INT DEFAULT 1 NOT NULL,
  `step1CompletedAt` DATETIME,
  `step2CompletedAt` DATETIME,
  `step3CompletedAt` DATETIME,
  `step4CompletedAt` DATETIME,
  `step5CompletedAt` DATETIME,
  `step1Id` INT,
  `step2Id` INT,
  `step3Id` INT,
  `step4Id` INT,
  `step5Id` INT,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `completedAt` DATETIME,
  INDEX `idx_employee` (`employeeId`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Avaliações de Competências (Passo 3)
CREATE TABLE IF NOT EXISTS `avdCompetencyAssessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `processId` INT NOT NULL,
  `employeeId` INT NOT NULL,
  `assessmentType` ENUM('autoavaliacao', 'avaliacao_gestor', 'avaliacao_pares') DEFAULT 'autoavaliacao' NOT NULL,
  `evaluatorId` INT,
  `status` ENUM('em_andamento', 'concluida') DEFAULT 'em_andamento' NOT NULL,
  `overallScore` INT,
  `comments` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `completedAt` DATETIME,
  INDEX `idx_process` (`processId`),
  INDEX `idx_employee` (`employeeId`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Itens de Avaliação de Competências
CREATE TABLE IF NOT EXISTS `avdCompetencyAssessmentItems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessmentId` INT NOT NULL,
  `competencyId` INT NOT NULL,
  `score` INT NOT NULL,
  `comments` TEXT,
  `behaviorExamples` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_assessment` (`assessmentId`),
  INDEX `idx_competency` (`competencyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Avaliações de Desempenho (Passo 4)
CREATE TABLE IF NOT EXISTS `avdPerformanceAssessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `processId` INT NOT NULL,
  `employeeId` INT NOT NULL,
  `profileScore` INT,
  `pirScore` INT,
  `competencyScore` INT,
  `profileWeight` INT DEFAULT 20 NOT NULL,
  `pirWeight` INT DEFAULT 20 NOT NULL,
  `competencyWeight` INT DEFAULT 60 NOT NULL,
  `finalScore` INT NOT NULL,
  `performanceRating` ENUM('insatisfatorio', 'abaixo_expectativas', 'atende_expectativas', 'supera_expectativas', 'excepcional') NOT NULL,
  `strengthsAnalysis` TEXT,
  `gapsAnalysis` TEXT,
  `developmentRecommendations` TEXT,
  `careerRecommendations` TEXT,
  `evaluatorComments` TEXT,
  `evaluatorId` INT,
  `status` ENUM('em_andamento', 'concluida', 'aprovada') DEFAULT 'em_andamento' NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `completedAt` DATETIME,
  `approvedAt` DATETIME,
  `approvedBy` INT,
  INDEX `idx_process` (`processId`),
  INDEX `idx_employee` (`employeeId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_rating` (`performanceRating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Planos de Desenvolvimento Individual (Passo 5)
CREATE TABLE IF NOT EXISTS `avdDevelopmentPlans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `processId` INT NOT NULL,
  `employeeId` INT NOT NULL,
  `performanceAssessmentId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NOT NULL,
  `objectives` TEXT,
  `status` ENUM('rascunho', 'aguardando_aprovacao', 'aprovado', 'em_andamento', 'concluido', 'cancelado') DEFAULT 'rascunho' NOT NULL,
  `approvedBy` INT,
  `approvedAt` DATETIME,
  `approvalComments` TEXT,
  `overallProgress` INT DEFAULT 0 NOT NULL,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `completedAt` DATETIME,
  INDEX `idx_process` (`processId`),
  INDEX `idx_employee` (`employeeId`),
  INDEX `idx_performance_assessment` (`performanceAssessmentId`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Ações de Desenvolvimento
CREATE TABLE IF NOT EXISTS `avdDevelopmentActions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `planId` INT NOT NULL,
  `competencyId` INT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `actionType` ENUM('experiencia_pratica', 'mentoria_feedback', 'treinamento_formal') NOT NULL,
  `category` VARCHAR(100),
  `responsibleId` INT,
  `dueDate` DATETIME NOT NULL,
  `successMetrics` TEXT,
  `expectedOutcome` TEXT,
  `status` ENUM('nao_iniciada', 'em_andamento', 'concluida', 'cancelada', 'atrasada') DEFAULT 'nao_iniciada' NOT NULL,
  `progress` INT DEFAULT 0 NOT NULL,
  `evidences` TEXT,
  `effectiveness` INT,
  `feedback` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `completedAt` DATETIME,
  INDEX `idx_plan` (`planId`),
  INDEX `idx_competency` (`competencyId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_due_date` (`dueDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Acompanhamento de Ações
CREATE TABLE IF NOT EXISTS `avdDevelopmentActionProgress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actionId` INT NOT NULL,
  `progressPercent` INT NOT NULL,
  `comments` TEXT,
  `evidenceUrl` VARCHAR(512),
  `evidenceType` VARCHAR(50),
  `registeredBy` INT NOT NULL,
  `registeredAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_action` (`actionId`),
  INDEX `idx_registered_at` (`registeredAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mensagem de sucesso
SELECT 'Tabelas do Sistema AVD (5 Passos) criadas com sucesso!' AS status;
