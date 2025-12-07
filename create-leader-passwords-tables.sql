-- Criar tabela de senhas de líderes
CREATE TABLE IF NOT EXISTS `leaderPasswords` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `leaderId` INT NOT NULL,
  `systemName` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `encryptedPassword` TEXT NOT NULL,
  `url` VARCHAR(512),
  `notes` TEXT,
  `category` ENUM('sistema_rh', 'sistema_financeiro', 'sistema_operacional', 'portal_web', 'outro') NOT NULL DEFAULT 'outro',
  `lastAccessedAt` DATETIME,
  `lastAccessedBy` INT,
  `expiresAt` DATETIME,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de logs de acesso às senhas
CREATE TABLE IF NOT EXISTS `leaderPasswordAccessLogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `passwordId` INT NOT NULL,
  `accessedBy` INT NOT NULL,
  `action` ENUM('view', 'copy', 'edit', 'delete') NOT NULL,
  `ipAddress` VARCHAR(45),
  `userAgent` TEXT,
  `accessedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
