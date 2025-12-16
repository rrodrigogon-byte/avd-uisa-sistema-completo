-- Fluxo de Aprovação de Descrições de Cargos
CREATE TABLE IF NOT EXISTS jobDescriptionApprovalFlow (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jobDescriptionId INT NOT NULL,
  version INT DEFAULT 1 NOT NULL,
  status ENUM('draft', 'pending_leader', 'pending_cs_specialist', 'pending_hr_manager', 'pending_gai_director', 'approved', 'rejected', 'returned') DEFAULT 'draft' NOT NULL,
  
  leaderId INT NOT NULL,
  leaderName VARCHAR(255),
  leaderStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending' NOT NULL,
  leaderComments TEXT,
  leaderDecidedAt DATETIME,
  
  csSpecialistId INT NOT NULL,
  csSpecialistName VARCHAR(255),
  csSpecialistStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending' NOT NULL,
  csSpecialistComments TEXT,
  csSpecialistDecidedAt DATETIME,
  
  hrManagerId INT NOT NULL,
  hrManagerName VARCHAR(255),
  hrManagerStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending' NOT NULL,
  hrManagerComments TEXT,
  hrManagerDecidedAt DATETIME,
  
  gaiDirectorId INT NOT NULL,
  gaiDirectorName VARCHAR(255),
  gaiDirectorStatus ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending' NOT NULL,
  gaiDirectorComments TEXT,
  gaiDirectorDecidedAt DATETIME,
  
  submittedBy INT,
  submittedAt DATETIME,
  completedAt DATETIME,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Histórico de Ações no Fluxo de Aprovação
CREATE TABLE IF NOT EXISTS jobDescriptionApprovalHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flowId INT NOT NULL,
  jobDescriptionId INT NOT NULL,
  action ENUM('created', 'submitted', 'approved', 'rejected', 'returned', 'resubmitted', 'cancelled') NOT NULL,
  level INT NOT NULL,
  levelName VARCHAR(100),
  userId INT NOT NULL,
  userName VARCHAR(255),
  userRole VARCHAR(100),
  comments TEXT,
  previousState JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Rotinas do Usuário
CREATE TABLE IF NOT EXISTS activityRoutines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  jobDescriptionId INT,
  responsibilityId INT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency ENUM('diaria', 'semanal', 'quinzenal', 'mensal', 'trimestral', 'eventual') NOT NULL,
  estimatedMinutes INT,
  category ENUM('processo', 'analise', 'planejamento', 'comunicacao', 'reuniao', 'relatorio', 'suporte', 'administrativo', 'outros') NOT NULL,
  isLinkedToJobDescription BOOLEAN DEFAULT FALSE NOT NULL,
  matchPercentage INT DEFAULT 0,
  matchNotes TEXT,
  weekDays JSON,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Logs de Atividades de Desktop/Laptop
CREATE TABLE IF NOT EXISTS desktopActivityLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  activityType ENUM('application', 'website', 'document', 'meeting', 'email', 'idle', 'other') NOT NULL,
  applicationName VARCHAR(255),
  windowTitle VARCHAR(500),
  url VARCHAR(1000),
  documentPath VARCHAR(500),
  startTime DATETIME NOT NULL,
  endTime DATETIME,
  durationSeconds INT,
  autoCategory VARCHAR(100),
  matchedResponsibilityId INT,
  confidenceScore INT,
  deviceId VARCHAR(100),
  deviceType ENUM('desktop', 'laptop', 'mobile') DEFAULT 'desktop',
  processed BOOLEAN DEFAULT FALSE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Confronto de Atividades com Descrição de Cargo
CREATE TABLE IF NOT EXISTS activityJobDescriptionMatch (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  jobDescriptionId INT NOT NULL,
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  totalActivitiesLogged INT DEFAULT 0,
  activitiesMatchedToJob INT DEFAULT 0,
  activitiesNotInJob INT DEFAULT 0,
  responsibilitiesNotExecuted INT DEFAULT 0,
  adherencePercentage INT DEFAULT 0,
  coveragePercentage INT DEFAULT 0,
  matchDetails JSON,
  gapsIdentified JSON,
  suggestedAdjustments JSON,
  executiveSummary TEXT,
  status ENUM('processing', 'completed', 'reviewed') DEFAULT 'processing' NOT NULL,
  reviewedBy INT,
  reviewedAt DATETIME,
  reviewComments TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Configuração de Aprovadores Padrão por Departamento
CREATE TABLE IF NOT EXISTS departmentApprovalConfig (
  id INT AUTO_INCREMENT PRIMARY KEY,
  departmentId INT NOT NULL,
  defaultCsSpecialistId INT,
  defaultCsSpecialistName VARCHAR(255),
  defaultHrManagerId INT,
  defaultHrManagerName VARCHAR(255),
  defaultGaiDirectorId INT,
  defaultGaiDirectorName VARCHAR(255),
  active BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Índices para performance
CREATE INDEX idx_approval_flow_job ON jobDescriptionApprovalFlow(jobDescriptionId);
CREATE INDEX idx_approval_flow_status ON jobDescriptionApprovalFlow(status);
CREATE INDEX idx_approval_history_flow ON jobDescriptionApprovalHistory(flowId);
CREATE INDEX idx_routines_employee ON activityRoutines(employeeId);
CREATE INDEX idx_desktop_logs_employee ON desktopActivityLogs(employeeId);
CREATE INDEX idx_desktop_logs_start ON desktopActivityLogs(startTime);
CREATE INDEX idx_match_employee ON activityJobDescriptionMatch(employeeId);
CREATE INDEX idx_match_job ON activityJobDescriptionMatch(jobDescriptionId);
