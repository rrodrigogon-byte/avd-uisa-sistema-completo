-- Índices para tabela activityLogs
-- Melhorar performance de queries por userId
CREATE INDEX IF NOT EXISTS idx_activityLogs_userId ON activityLogs(userId);

-- Melhorar performance de queries por timestamp/createdAt
CREATE INDEX IF NOT EXISTS idx_activityLogs_createdAt ON activityLogs(createdAt);

-- Melhorar performance de queries por tipo de atividade
CREATE INDEX IF NOT EXISTS idx_activityLogs_activityType ON activityLogs(activityType);

-- Índice composto para queries que filtram por userId e período
CREATE INDEX IF NOT EXISTS idx_activityLogs_userId_createdAt ON activityLogs(userId, createdAt);

-- Índice composto para queries que filtram por tipo e período
CREATE INDEX IF NOT EXISTS idx_activityLogs_activityType_createdAt ON activityLogs(activityType, createdAt);

-- Índices para tabela employees
-- Melhorar performance de buscas por nome
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);

-- Melhorar performance de buscas por email
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Melhorar performance de queries por departamento
CREATE INDEX IF NOT EXISTS idx_employees_departmentId ON employees(departmentId);

-- Melhorar performance de queries por status
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Índice composto para buscas globais (nome + email)
CREATE INDEX IF NOT EXISTS idx_employees_name_email ON employees(name, email);

-- Mostrar índices criados
SHOW INDEX FROM activityLogs;
SHOW INDEX FROM employees;
