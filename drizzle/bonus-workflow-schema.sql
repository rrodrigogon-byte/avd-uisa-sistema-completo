-- Schema de Workflow Multinível de Aprovação de Bônus

-- Tabela de configuração de workflows de aprovação
CREATE TABLE IF NOT EXISTS bonusApprovalWorkflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  minValue DECIMAL(15,2) DEFAULT 0 COMMENT 'Valor mínimo para aplicar este workflow',
  maxValue DECIMAL(15,2) COMMENT 'Valor máximo (NULL = sem limite)',
  departmentId INT COMMENT 'NULL = aplicável a todos os departamentos',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL
);

-- Tabela de níveis do workflow (gestor → gerente → diretor)
CREATE TABLE IF NOT EXISTS bonusApprovalLevels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflowId INT NOT NULL,
  levelOrder INT NOT NULL COMMENT 'Ordem do nível (1, 2, 3...)',
  approverRole VARCHAR(100) NOT NULL COMMENT 'gestor_direto, gerente, diretor, diretor_gente, cfo',
  requiresComment BOOLEAN DEFAULT FALSE,
  requiresEvidence BOOLEAN DEFAULT FALSE,
  timeoutDays INT DEFAULT 3 COMMENT 'Prazo em dias para aprovação',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflowId) REFERENCES bonusApprovalWorkflows(id) ON DELETE CASCADE,
  UNIQUE KEY unique_workflow_level (workflowId, levelOrder)
);

-- Tabela de instâncias de workflow (execução real)
CREATE TABLE IF NOT EXISTS bonusWorkflowInstances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bonusCalculationId INT NOT NULL,
  workflowId INT NOT NULL,
  currentLevel INT DEFAULT 1,
  status ENUM('em_andamento', 'aprovado', 'rejeitado', 'cancelado') DEFAULT 'em_andamento',
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  FOREIGN KEY (bonusCalculationId) REFERENCES bonusCalculations(id) ON DELETE CASCADE,
  FOREIGN KEY (workflowId) REFERENCES bonusApprovalWorkflows(id)
);

-- Tabela de aprovações por nível
CREATE TABLE IF NOT EXISTS bonusLevelApprovals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflowInstanceId INT NOT NULL,
  levelId INT NOT NULL,
  approverId INT NOT NULL COMMENT 'ID do usuário aprovador',
  status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
  comments TEXT,
  evidenceUrl VARCHAR(500) COMMENT 'URL de evidência (S3)',
  decidedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflowInstanceId) REFERENCES bonusWorkflowInstances(id) ON DELETE CASCADE,
  FOREIGN KEY (levelId) REFERENCES bonusApprovalLevels(id),
  FOREIGN KEY (approverId) REFERENCES users(id)
);

-- Índices para performance
CREATE INDEX idx_bonus_workflow_active ON bonusApprovalWorkflows(isActive);
CREATE INDEX idx_bonus_workflow_dept ON bonusApprovalWorkflows(departmentId);
CREATE INDEX idx_bonus_workflow_instance_status ON bonusWorkflowInstances(status);
CREATE INDEX idx_bonus_level_approval_status ON bonusLevelApprovals(status);
CREATE INDEX idx_bonus_level_approval_approver ON bonusLevelApprovals(approverId);
