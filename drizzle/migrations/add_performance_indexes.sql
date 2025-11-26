-- Migration: Adicionar índices para otimizar performance de queries frequentes
-- Data: 2025-11-26
-- Descrição: Índices para melhorar performance de buscas, filtros e joins

-- Índices para tabela employees (buscas frequentes)
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(departmentId);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON employees(cpf);

-- Índices para tabela evaluationInstances (queries de avaliações)
CREATE INDEX IF NOT EXISTS idx_eval_instances_employee ON evaluationInstances(employeeId);
CREATE INDEX IF NOT EXISTS idx_eval_instances_evaluator ON evaluationInstances(evaluatorId);
CREATE INDEX IF NOT EXISTS idx_eval_instances_cycle ON evaluationInstances(cycleId);
CREATE INDEX IF NOT EXISTS idx_eval_instances_status ON evaluationInstances(status);
CREATE INDEX IF NOT EXISTS idx_eval_instances_type ON evaluationInstances(evaluationType);
CREATE INDEX IF NOT EXISTS idx_eval_instances_due_date ON evaluationInstances(dueDate);

-- Índices para tabela evaluationCycles (filtros de ciclos)
CREATE INDEX IF NOT EXISTS idx_eval_cycles_status ON evaluationCycles(status);
CREATE INDEX IF NOT EXISTS idx_eval_cycles_dates ON evaluationCycles(startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_eval_cycles_created ON evaluationCycles(createdBy);

-- Índices para tabela goals (metas)
CREATE INDEX IF NOT EXISTS idx_goals_employee ON goals(employeeId);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_period ON goals(startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_goals_cycle ON goals(cycleId);

-- Índices para tabela pdis (planos de desenvolvimento)
CREATE INDEX IF NOT EXISTS idx_pdis_employee ON pdis(employeeId);
CREATE INDEX IF NOT EXISTS idx_pdis_status ON pdis(status);
CREATE INDEX IF NOT EXISTS idx_pdis_created ON pdis(createdBy);

-- Índices para tabela feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_receiver ON feedbacks(receiverId);
CREATE INDEX IF NOT EXISTS idx_feedbacks_giver ON feedbacks(giverId);
CREATE INDEX IF NOT EXISTS idx_feedbacks_date ON feedbacks(feedbackDate);

-- Índices para tabela pulseSurveys (pesquisas)
CREATE INDEX IF NOT EXISTS idx_pulse_surveys_status ON pulseSurveys(status);
CREATE INDEX IF NOT EXISTS idx_pulse_surveys_dates ON pulseSurveys(createdAt, closedAt);

-- Índices para tabela pulseSurveyResponses (respostas)
CREATE INDEX IF NOT EXISTS idx_pulse_responses_survey ON pulseSurveyResponses(surveyId);
CREATE INDEX IF NOT EXISTS idx_pulse_responses_employee ON pulseSurveyResponses(employeeId);

-- Índices para tabela departments
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parentId);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(managerId);

-- Índices para tabela bonusCalculations
CREATE INDEX IF NOT EXISTS idx_bonus_employee ON bonusCalculations(employeeId);
CREATE INDEX IF NOT EXISTS idx_bonus_cycle ON bonusCalculations(cycleId);
CREATE INDEX IF NOT EXISTS idx_bonus_status ON bonusCalculations(status);

-- Índices compostos para queries complexas
CREATE INDEX IF NOT EXISTS idx_eval_instances_emp_status ON evaluationInstances(employeeId, status);
CREATE INDEX IF NOT EXISTS idx_eval_instances_cycle_status ON evaluationInstances(cycleId, status);
CREATE INDEX IF NOT EXISTS idx_goals_emp_status ON goals(employeeId, status);

-- Índices para auditoria e logs
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON auditTrail(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON auditTrail(userId);
CREATE INDEX IF NOT EXISTS idx_audit_trail_date ON auditTrail(timestamp);

-- Comentários sobre os índices
-- Estes índices foram criados baseados em:
-- 1. Queries mais frequentes identificadas no código
-- 2. Filtros comuns em listagens e dashboards
-- 3. Joins frequentes entre tabelas
-- 4. Buscas por texto (name, email, cpf)
-- 
-- Monitorar performance após criação dos índices:
-- - EXPLAIN SELECT ... para verificar uso dos índices
-- - SHOW INDEX FROM table_name para listar índices
-- - Considerar remover índices não utilizados
