-- Script SQL para adicionar tabelas de configuração de aprovações
-- Sistema AVD UISA

-- Tabela de Configuração de Fluxos de Aprovação
CREATE TABLE IF NOT EXISTS `approvalFlowConfigs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `processType` ENUM(
    'job_description',
    'performance_review',
    'salary_adjustment',
    'promotion',
    'bonus_approval',
    'pdi_approval',
    'hiring',
    'termination',
    'transfer',
    'custom'
  ) NOT NULL,
  `scope` ENUM('global', 'department', 'position', 'level') NOT NULL DEFAULT 'global',
  `departmentId` INT,
  `positionId` INT,
  `hierarchyLevel` VARCHAR(50),
  `approvalLevels` JSON NOT NULL,
  `allowParallelApproval` BOOLEAN NOT NULL DEFAULT FALSE,
  `allowSkipLevels` BOOLEAN NOT NULL DEFAULT FALSE,
  `requireComments` BOOLEAN NOT NULL DEFAULT FALSE,
  `notifyOnEachLevel` BOOLEAN NOT NULL DEFAULT TRUE,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `isDefault` BOOLEAN NOT NULL DEFAULT FALSE,
  `priority` INT NOT NULL DEFAULT 0,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Instâncias de Aprovação
CREATE TABLE IF NOT EXISTS `approvalInstances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `flowConfigId` INT NOT NULL,
  `processType` VARCHAR(50) NOT NULL,
  `processId` INT NOT NULL,
  `processTitle` VARCHAR(500),
  `requesterId` INT NOT NULL,
  `requesterName` VARCHAR(255),
  `status` ENUM(
    'draft',
    'pending',
    'in_progress',
    'approved',
    'rejected',
    'cancelled',
    'expired'
  ) NOT NULL DEFAULT 'draft',
  `currentLevel` INT NOT NULL DEFAULT 1,
  `processData` JSON,
  `metadata` JSON,
  `submittedAt` DATETIME,
  `completedAt` DATETIME,
  `expiresAt` DATETIME,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Ações de Aprovação
CREATE TABLE IF NOT EXISTS `approvalActions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `instanceId` INT NOT NULL,
  `level` INT NOT NULL,
  `approverId` INT NOT NULL,
  `approverName` VARCHAR(255),
  `approverRole` VARCHAR(100),
  `action` ENUM(
    'approved',
    'rejected',
    'returned',
    'delegated',
    'commented'
  ) NOT NULL,
  `comments` TEXT,
  `attachments` JSON,
  `delegatedTo` INT,
  `delegatedToName` VARCHAR(255),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notificações de Aprovação
CREATE TABLE IF NOT EXISTS `approvalNotifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `instanceId` INT NOT NULL,
  `recipientId` INT NOT NULL,
  `recipientEmail` VARCHAR(320),
  `notificationType` ENUM(
    'approval_request',
    'approval_reminder',
    'approval_approved',
    'approval_rejected',
    'approval_completed',
    'approval_expired',
    'approval_delegated'
  ) NOT NULL,
  `subject` VARCHAR(500),
  `message` TEXT,
  `status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  `sentAt` DATETIME,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS `idx_approvalFlowConfigs_processType` ON `approvalFlowConfigs`(`processType`);
CREATE INDEX IF NOT EXISTS `idx_approvalFlowConfigs_scope` ON `approvalFlowConfigs`(`scope`);
CREATE INDEX IF NOT EXISTS `idx_approvalFlowConfigs_active` ON `approvalFlowConfigs`(`active`);

CREATE INDEX IF NOT EXISTS `idx_approvalInstances_flowConfigId` ON `approvalInstances`(`flowConfigId`);
CREATE INDEX IF NOT EXISTS `idx_approvalInstances_processType` ON `approvalInstances`(`processType`);
CREATE INDEX IF NOT EXISTS `idx_approvalInstances_status` ON `approvalInstances`(`status`);
CREATE INDEX IF NOT EXISTS `idx_approvalInstances_requesterId` ON `approvalInstances`(`requesterId`);

CREATE INDEX IF NOT EXISTS `idx_approvalActions_instanceId` ON `approvalActions`(`instanceId`);
CREATE INDEX IF NOT EXISTS `idx_approvalActions_approverId` ON `approvalActions`(`approverId`);

CREATE INDEX IF NOT EXISTS `idx_approvalNotifications_instanceId` ON `approvalNotifications`(`instanceId`);
CREATE INDEX IF NOT EXISTS `idx_approvalNotifications_recipientId` ON `approvalNotifications`(`recipientId`);
CREATE INDEX IF NOT EXISTS `idx_approvalNotifications_status` ON `approvalNotifications`(`status`);
