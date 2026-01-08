-- ============================================================================
-- MIGRATION: ADD MULTI-TENANCY SUPPORT
-- Data: 08/01/2026
-- Descrição: Adiciona suporte a multi-tenancy com isolamento por tenant_id
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELAS DE MULTI-TENANCY
-- ============================================================================

-- Tabela de Tenants (Empresas)
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único do tenant (ex: UISA, EMPRESA_2)',
  `name` VARCHAR(255) NOT NULL COMMENT 'Nome da empresa',
  `legalName` VARCHAR(255) COMMENT 'Razão social',
  `cnpj` VARCHAR(18) UNIQUE COMMENT 'CNPJ formatado',
  
  -- Configurações
  `active` BOOLEAN DEFAULT TRUE NOT NULL,
  `settings` JSON COMMENT 'Configurações específicas do tenant',
  
  -- Limites e Quotas
  `maxUsers` INT DEFAULT 1000 NOT NULL,
  `maxEmployees` INT DEFAULT 5000 NOT NULL,
  
  -- Contato
  `contactName` VARCHAR(255),
  `contactEmail` VARCHAR(320),
  `contactPhone` VARCHAR(20),
  
  -- Endereço
  `address` TEXT,
  `city` VARCHAR(100),
  `state` VARCHAR(2),
  `zipCode` VARCHAR(10),
  
  -- Plano e Billing
  `planType` ENUM('trial', 'basic', 'professional', 'enterprise') DEFAULT 'trial' NOT NULL,
  `trialEndsAt` DATETIME,
  `subscriptionExpiresAt` DATETIME,
  
  -- Metadados
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `createdBy` INT,
  
  INDEX idx_tenant_code (code),
  INDEX idx_tenant_active (active),
  INDEX idx_tenant_plan (planType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Usuários por Tenant (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS `tenantUsers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenantId` INT NOT NULL,
  `userId` INT NOT NULL,
  
  -- Role específico para este tenant
  `role` ENUM('super_admin', 'admin', 'manager', 'user') DEFAULT 'user' NOT NULL,
  
  -- Permissões específicas (JSON array)
  `permissions` JSON,
  
  -- Status
  `active` BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Metadados
  `joinedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `lastAccessAt` TIMESTAMP NULL,
  
  UNIQUE KEY unique_tenant_user (tenantId, userId),
  INDEX idx_tenant_user_tenant (tenantId),
  INDEX idx_tenant_user_user (userId),
  INDEX idx_tenant_user_active (active),
  
  FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Auditoria de Tenants
CREATE TABLE IF NOT EXISTS `tenantAuditLogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenantId` INT NOT NULL,
  `userId` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL COMMENT 'Ação realizada',
  `entityType` VARCHAR(100) COMMENT 'Tipo de entidade',
  `entityId` INT COMMENT 'ID da entidade',
  `details` JSON COMMENT 'Detalhes da ação',
  `ipAddress` VARCHAR(45),
  `userAgent` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_tenant_audit_tenant (tenantId),
  INDEX idx_tenant_audit_user (userId),
  INDEX idx_tenant_audit_action (action),
  INDEX idx_tenant_audit_entity (entityType, entityId),
  INDEX idx_tenant_audit_created (createdAt),
  
  FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. ADICIONAR tenant_id ÀS TABELAS PRINCIPAIS
-- ============================================================================

-- Lista de tabelas que precisam de tenant_id
-- Nota: Algumas tabelas não precisam de tenant_id (ex: users, adminUsers)

-- Estrutura Organizacional
ALTER TABLE `departments` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `departments` ADD INDEX IF NOT EXISTS `idx_dept_tenant` (`tenantId`);

ALTER TABLE `positions` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `positions` ADD INDEX IF NOT EXISTS `idx_pos_tenant` (`tenantId`);

ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `employees` ADD INDEX IF NOT EXISTS `idx_emp_tenant` (`tenantId`);

-- Competências
ALTER TABLE `competencies` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `competencies` ADD INDEX IF NOT EXISTS `idx_comp_tenant` (`tenantId`);

-- Metas (Goals)
ALTER TABLE `goals` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `goals` ADD INDEX IF NOT EXISTS `idx_goal_tenant` (`tenantId`);

ALTER TABLE `corporateGoals` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `corporateGoals` ADD INDEX IF NOT EXISTS `idx_corp_goal_tenant` (`tenantId`);

-- PDI
ALTER TABLE `pdiIntelligent` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `pdiIntelligent` ADD INDEX IF NOT EXISTS `idx_pdi_tenant` (`tenantId`);

-- Avaliações 360°
ALTER TABLE `evaluationCycles` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `evaluationCycles` ADD INDEX IF NOT EXISTS `idx_eval_cycle_tenant` (`tenantId`);

ALTER TABLE `evaluations360` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `evaluations360` ADD INDEX IF NOT EXISTS `idx_eval_360_tenant` (`tenantId`);

-- Nine Box
ALTER TABLE `nineBoxPlacements` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `nineBoxPlacements` ADD INDEX IF NOT EXISTS `idx_nine_box_tenant` (`tenantId`);

-- Sucessão
ALTER TABLE `successionPlans` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `successionPlans` ADD INDEX IF NOT EXISTS `idx_succ_tenant` (`tenantId`);

-- Calibração
ALTER TABLE `calibrationMeetings` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `calibrationMeetings` ADD INDEX IF NOT EXISTS `idx_calib_tenant` (`tenantId`);

-- Bônus
ALTER TABLE `bonusPolicies` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `bonusPolicies` ADD INDEX IF NOT EXISTS `idx_bonus_pol_tenant` (`tenantId`);

ALTER TABLE `bonusCalculations` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `bonusCalculations` ADD INDEX IF NOT EXISTS `idx_bonus_calc_tenant` (`tenantId`);

-- Testes Psicométricos
ALTER TABLE `psychometricTests` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `psychometricTests` ADD INDEX IF NOT EXISTS `idx_psych_test_tenant` (`tenantId`);

-- Pesquisas Pulse
ALTER TABLE `pulseSurveys` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `pulseSurveys` ADD INDEX IF NOT EXISTS `idx_pulse_tenant` (`tenantId`);

-- Descrições de Cargo
ALTER TABLE `jobDescriptions` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `jobDescriptions` ADD INDEX IF NOT EXISTS `idx_job_desc_tenant` (`tenantId`);

-- Feedbacks
ALTER TABLE `feedbacks` ADD COLUMN IF NOT EXISTS `tenantId` INT NULL AFTER `id`;
ALTER TABLE `feedbacks` ADD INDEX IF NOT EXISTS `idx_feedback_tenant` (`tenantId`);

-- ============================================================================
-- 3. INSERIR TENANT DEFAULT (UISA)
-- ============================================================================

INSERT INTO `tenants` (
  `code`,
  `name`,
  `legalName`,
  `cnpj`,
  `active`,
  `maxUsers`,
  `maxEmployees`,
  `contactName`,
  `contactEmail`,
  `planType`,
  `createdAt`
) VALUES (
  'UISA',
  'UISA - Bioenergia + Açúcar',
  'UISA Indústria S.A.',
  '12.345.678/0001-99',
  TRUE,
  5000,
  10000,
  'Administrador UISA',
  'admin@uisa.com.br',
  'enterprise',
  NOW()
) ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `updatedAt` = NOW();

-- Obter ID do tenant UISA
SET @tenant_uisa_id = (SELECT id FROM tenants WHERE code = 'UISA' LIMIT 1);

-- ============================================================================
-- 4. ATUALIZAR REGISTROS EXISTENTES COM tenant_id DO UISA
-- ============================================================================

-- IMPORTANTE: Atualizar todos os registros existentes para o tenant UISA
-- Isso garante compatibilidade com dados já existentes

UPDATE `departments` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `positions` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `employees` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `competencies` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `goals` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `corporateGoals` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `pdiIntelligent` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `evaluationCycles` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `evaluations360` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `nineBoxPlacements` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `successionPlans` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `calibrationMeetings` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `bonusPolicies` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `bonusCalculations` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `psychometricTests` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `pulseSurveys` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `jobDescriptions` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;
UPDATE `feedbacks` SET `tenantId` = @tenant_uisa_id WHERE `tenantId` IS NULL;

-- ============================================================================
-- 5. TORNAR tenant_id OBRIGATÓRIO NAS TABELAS (APÓS ATUALIZAÇÃO)
-- ============================================================================

-- NOTA: Descomentar estas linhas APÓS garantir que todos os registros possuem tenant_id
-- ALTER TABLE `departments` MODIFY COLUMN `tenantId` INT NOT NULL;
-- ALTER TABLE `positions` MODIFY COLUMN `tenantId` INT NOT NULL;
-- ALTER TABLE `employees` MODIFY COLUMN `tenantId` INT NOT NULL;
-- ... (repetir para todas as tabelas)

-- ============================================================================
-- 6. ADICIONAR FOREIGN KEYS (OPCIONAL - RECOMENDADO)
-- ============================================================================

-- NOTA: Adicionar após garantir integridade dos dados
-- ALTER TABLE `departments` ADD FOREIGN KEY (tenantId) REFERENCES tenants(id);
-- ALTER TABLE `positions` ADD FOREIGN KEY (tenantId) REFERENCES tenants(id);
-- ... (repetir para todas as tabelas)

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificar se migration foi aplicada corretamente
SELECT 
  'Migration completed!' as status,
  COUNT(*) as total_tenants 
FROM tenants;

SELECT
  'Default tenant (UISA) ID:' as info,
  id,
  code,
  name
FROM tenants
WHERE code = 'UISA';
