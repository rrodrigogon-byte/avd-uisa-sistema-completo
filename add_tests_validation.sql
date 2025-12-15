-- Adicionar campo para validação de testes na tabela performanceEvaluations
ALTER TABLE performanceEvaluations 
ADD COLUMN testsValidated BOOLEAN DEFAULT FALSE NOT NULL AFTER managerEvaluationCompleted,
ADD COLUMN testsValidatedAt DATETIME NULL AFTER testsValidated,
ADD COLUMN testsValidatedBy INT NULL AFTER testsValidatedAt;
