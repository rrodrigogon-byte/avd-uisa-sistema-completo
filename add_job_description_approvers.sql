-- Adicionar campos de aprovadores na tabela jobDescriptions
ALTER TABLE jobDescriptions 
ADD COLUMN costCenterApproverId INT NULL AFTER status,
ADD COLUMN salaryLeaderId INT NULL AFTER costCenterApproverId,
ADD COLUMN costCenterApprovedAt DATETIME NULL AFTER salaryLeaderId,
ADD COLUMN salaryLeaderApprovedAt DATETIME NULL AFTER costCenterApprovedAt;

-- Adicionar comentários
ALTER TABLE jobDescriptions 
MODIFY COLUMN costCenterApproverId INT NULL COMMENT 'Aprovador do Centro de Custo',
MODIFY COLUMN salaryLeaderId INT NULL COMMENT 'Líder de Cargos e Salários',
MODIFY COLUMN costCenterApprovedAt DATETIME NULL COMMENT 'Data de aprovação do aprovador CC',
MODIFY COLUMN salaryLeaderApprovedAt DATETIME NULL COMMENT 'Data de aprovação do líder C&S';
