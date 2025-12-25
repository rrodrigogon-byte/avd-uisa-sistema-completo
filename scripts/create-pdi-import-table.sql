CREATE TABLE IF NOT EXISTS `pdiImportHistory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fileName` VARCHAR(255) NOT NULL,
  `fileSize` INT NOT NULL,
  `fileType` ENUM('xlsx', 'xls', 'csv', 'pdf', 'html', 'txt') NOT NULL,
  `fileUrl` VARCHAR(512),
  `status` ENUM('processando', 'concluido', 'erro', 'parcial') NOT NULL DEFAULT 'processando',
  `totalRecords` INT NOT NULL DEFAULT 0,
  `successCount` INT NOT NULL DEFAULT 0,
  `errorCount` INT NOT NULL DEFAULT 0,
  `errors` JSON,
  `importedBy` INT NOT NULL,
  `startedAt` DATETIME NOT NULL,
  `completedAt` DATETIME,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
