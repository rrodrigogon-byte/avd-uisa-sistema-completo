-- Criar tabelas para sistema de testes psicométricos completo

-- Tabela de convites para testes
CREATE TABLE IF NOT EXISTS testInvitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  testType ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors') NOT NULL,
  uniqueToken VARCHAR(128) NOT NULL UNIQUE,
  status ENUM('pendente', 'em_andamento', 'concluido', 'expirado') DEFAULT 'pendente' NOT NULL,
  sentAt DATETIME NOT NULL,
  expiresAt DATETIME NOT NULL,
  startedAt DATETIME,
  completedAt DATETIME,
  emailSent BOOLEAN DEFAULT FALSE NOT NULL,
  emailSentAt DATETIME,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_employee (employeeId),
  INDEX idx_token (uniqueToken),
  INDEX idx_status (status)
);

-- Tabela de respostas individuais
CREATE TABLE IF NOT EXISTS testResponses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invitationId INT NOT NULL,
  questionId INT NOT NULL,
  answer INT NOT NULL,
  responseTime INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_invitation (invitationId),
  INDEX idx_question (questionId)
);

-- Tabela de resultados consolidados
CREATE TABLE IF NOT EXISTS testResults (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invitationId INT NOT NULL,
  employeeId INT NOT NULL,
  testType ENUM('disc', 'bigfive', 'mbti', 'ie', 'vark', 'leadership', 'careeranchors') NOT NULL,
  scores TEXT NOT NULL,
  profileType VARCHAR(50),
  profileDescription TEXT,
  strengths TEXT,
  developmentAreas TEXT,
  workStyle TEXT,
  communicationStyle TEXT,
  leadershipStyle TEXT,
  motivators TEXT,
  stressors TEXT,
  teamContribution TEXT,
  careerRecommendations TEXT,
  rawData TEXT,
  completedAt DATETIME NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_employee (employeeId),
  INDEX idx_invitation (invitationId),
  INDEX idx_test_type (testType)
);
