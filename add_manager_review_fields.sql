-- Adicionar campos de revisão do gestor
ALTER TABLE performanceEvaluations
ADD COLUMN IF NOT EXISTS managerReviewStatus ENUM('approved', 'rejected', 'needs_revision') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS managerReviewedAt DATETIME DEFAULT NULL;
