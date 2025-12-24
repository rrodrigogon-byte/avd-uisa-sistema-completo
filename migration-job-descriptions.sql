-- Migração Manual: Melhorias em Descrições de Cargo
-- Data: 24/12/2025

-- ============================================================================
-- 1. ADICIONAR NOVOS CAMPOS NA TABELA jobDescriptions
-- ============================================================================

-- Identificação
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS positionCode VARCHAR(50) AFTER positionTitle;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS hierarchyLevel ENUM('junior', 'pleno', 'senior', 'coordenacao', 'gerencia', 'diretoria') AFTER division;

-- Missão e Objetivo
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS mission TEXT AFTER revision;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS strategicObjective TEXT AFTER mission;

-- Relacionamentos
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS subordinates JSON AFTER reportsTo;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS internalInterfaces JSON AFTER subordinates;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS externalClients TEXT AFTER internalInterfaces;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS suppliers TEXT AFTER externalClients;

-- Requisitos Técnicos
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS minimumExperienceYears INT AFTER educationLevel;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS languages JSON AFTER requiredExperience;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS certifications JSON AFTER languages;

-- Indicadores de Desempenho
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS kpis JSON AFTER mandatoryTraining;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS quantitativeGoals JSON AFTER kpis;

-- Condições de Trabalho
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS workSchedule VARCHAR(100) AFTER quantitativeGoals;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS workLocation ENUM('presencial', 'hibrido', 'remoto') DEFAULT 'presencial' AFTER workSchedule;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS travelFrequency VARCHAR(100) AFTER workLocation;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS specialConditions TEXT AFTER travelFrequency;

-- Workflow de Aprovação (atualizar status)
ALTER TABLE jobDescriptions MODIFY COLUMN status ENUM(
  'draft',
  'pending_leader',
  'pending_cs_specialist',
  'pending_hr_manager',
  'pending_director',
  'approved',
  'rejected'
) DEFAULT 'draft' NOT NULL;

ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS currentApprovalLevel INT DEFAULT 0 AFTER status;

-- Campos complementares por aprovadores
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS leaderComments TEXT AFTER currentApprovalLevel;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS specialistComments TEXT AFTER leaderComments;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS hrManagerComments TEXT AFTER specialistComments;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS directorComments TEXT AFTER hrManagerComments;

-- Prazo e Notificações
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS approvalDeadline DATETIME AFTER directorComments;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS reminderSentAt DATETIME AFTER approvalDeadline;

-- Versionamento
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS versionNumber INT DEFAULT 1 AFTER reminderSentAt;
ALTER TABLE jobDescriptions ADD COLUMN IF NOT EXISTS previousVersionId INT AFTER versionNumber;

-- ============================================================================
-- 2. ATUALIZAR TABELA jobDescriptionWorkflow
-- ============================================================================

-- Atualizar status para novo formato
ALTER TABLE jobDescriptionWorkflow MODIFY COLUMN status ENUM(
  'draft',
  'pending_leader',
  'pending_cs_specialist',
  'pending_hr_manager',
  'pending_director',
  'approved',
  'rejected'
) DEFAULT 'draft' NOT NULL;

-- Adicionar constraint unique no jobDescriptionId (remover se já existir)
-- ALTER TABLE jobDescriptionWorkflow DROP INDEX idx_job_description_id;
ALTER TABLE jobDescriptionWorkflow ADD UNIQUE INDEX idx_job_description_id (jobDescriptionId);

-- Renomear colunas antigas para novo padrão
ALTER TABLE jobDescriptionWorkflow CHANGE COLUMN IF EXISTS directLeaderId leaderId INT;
ALTER TABLE jobDescriptionWorkflow CHANGE COLUMN IF EXISTS gaiDirectorId directorId INT;
ALTER TABLE jobDescriptionWorkflow CHANGE COLUMN IF EXISTS directLeaderApprovedAt leaderApprovedAt DATETIME;
ALTER TABLE jobDescriptionWorkflow CHANGE COLUMN IF EXISTS gaiDirectorApprovedAt directorApprovedAt DATETIME;
ALTER TABLE jobDescriptionWorkflow CHANGE COLUMN IF EXISTS directLeaderComments leaderComments TEXT;
ALTER TABLE jobDescriptionWorkflow CHANGE COLUMN IF EXISTS gaiDirectorComments directorComments TEXT;

-- Adicionar novos campos de status por nível
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS leaderStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER directorId;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS csSpecialistStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER leaderStatus;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS hrManagerStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER csSpecialistStatus;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS directorStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER hrManagerStatus;

-- Adicionar campos de prazos por nível
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS approvalDeadline DATETIME AFTER directorComments;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS level1Deadline DATETIME AFTER approvalDeadline;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS level2Deadline DATETIME AFTER level1Deadline;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS level3Deadline DATETIME AFTER level2Deadline;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS level4Deadline DATETIME AFTER level3Deadline;
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS lastReminderSentAt DATETIME AFTER level4Deadline;

-- Adicionar campo submittedAt
ALTER TABLE jobDescriptionWorkflow ADD COLUMN IF NOT EXISTS submittedAt DATETIME AFTER completedAt;

-- ============================================================================
-- 3. ATUALIZAR DADOS EXISTENTES
-- ============================================================================

-- Migrar mainObjective para mission (se mission estiver vazio)
UPDATE jobDescriptions 
SET mission = mainObjective 
WHERE mission IS NULL OR mission = '';

-- Atualizar currentLevel baseado no status
UPDATE jobDescriptionWorkflow 
SET currentLevel = CASE 
  WHEN status = 'draft' THEN 0
  WHEN status = 'pending_leader' THEN 1
  WHEN status = 'pending_cs_specialist' THEN 2
  WHEN status = 'pending_hr_manager' THEN 3
  WHEN status = 'pending_director' THEN 4
  WHEN status = 'approved' THEN 4
  ELSE 0
END
WHERE currentLevel = 1; -- Apenas atualizar os que ainda estão no valor padrão antigo

-- ============================================================================
-- 4. VERIFICAÇÕES
-- ============================================================================

-- Verificar estrutura da tabela jobDescriptions
SHOW COLUMNS FROM jobDescriptions;

-- Verificar estrutura da tabela jobDescriptionWorkflow
SHOW COLUMNS FROM jobDescriptionWorkflow;

-- Contar registros
SELECT COUNT(*) as total_descricoes FROM jobDescriptions;
SELECT COUNT(*) as total_workflows FROM jobDescriptionWorkflow;

-- Verificar status
SELECT status, COUNT(*) as total 
FROM jobDescriptions 
GROUP BY status;

SELECT status, currentLevel, COUNT(*) as total 
FROM jobDescriptionWorkflow 
GROUP BY status, currentLevel;
