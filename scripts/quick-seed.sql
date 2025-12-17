-- Script SQL para popular dados de demonstração rapidamente
-- Sistema AVD UISA

-- 1. Buscar IDs necessários
SET @cycle_id = (SELECT id FROM evaluationCycles WHERE status = 'em_andamento' LIMIT 1);
SET @employee_id = (SELECT id FROM employees ORDER BY RAND() LIMIT 1);

-- 2. Inserir 5 Metas SMART de exemplo
INSERT INTO smartGoals (
  employeeId, cycleId, title, description, category, type,
  measurementUnit, targetValue, currentValue, progress, weight, status,
  startDate, dueDate, bonusEligible, bonusType, bonusValue,
  isSpecific, isMeasurable, isAchievable, isRelevant, isTimeBound,
  smartScore, createdAt, updatedAt
) VALUES
-- Meta 1: Financeira
(@employee_id, @cycle_id, 'Reduzir Custos Operacionais em 15%', 
 'Implementar medidas de eficiência para reduzir custos operacionais do departamento em 15% até o final do trimestre.',
 'financial', 'individual', 'percentage', 15.00, 3.50, 23, 30, 'on_track',
 '2025-01-01', '2025-06-30', TRUE, 'percentage', 5.00,
 TRUE, TRUE, TRUE, TRUE, TRUE, 100, NOW(), NOW()),

-- Meta 2: Comportamental
(@employee_id, @cycle_id, 'Melhorar Comunicação com a Equipe',
 'Realizar reuniões semanais de alinhamento e feedback com todos os membros da equipe para melhorar comunicação.',
 'behavioral', 'individual', 'count', 48.00, 12.00, 25, 20, 'on_track',
 '2025-01-01', '2025-12-31', FALSE, NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 100, NOW(), NOW()),

-- Meta 3: Corporativa
(@employee_id, @cycle_id, 'Aumentar NPS para 80 pontos',
 'Melhorar experiência do cliente para elevar Net Promoter Score de 65 para 80 pontos.',
 'corporate', 'individual', 'score', 80.00, 70.00, 50, 30, 'on_track',
 '2025-01-01', '2025-09-30', TRUE, 'percentage', 5.00,
 TRUE, TRUE, TRUE, TRUE, TRUE, 100, NOW(), NOW()),

-- Meta 4: Desenvolvimento
(@employee_id, @cycle_id, 'Completar MBA em Gestão Estratégica',
 'Concluir curso de MBA com nota mínima 8.0 e aplicar conhecimentos no trabalho.',
 'development', 'individual', 'count', 1.00, 0.00, 0, 30, 'draft',
 '2025-01-01', '2025-12-31', TRUE, 'fixed', 3000.00,
 TRUE, TRUE, TRUE, TRUE, TRUE, 100, NOW(), NOW()),

-- Meta 5: Financeira com Bônus
(@employee_id, @cycle_id, 'Aumentar Receita em R$ 500.000',
 'Gerar R$ 500.000 em receita adicional através de novos contratos e expansão de serviços.',
 'financial', 'individual', 'currency', 500000.00, 125000.00, 25, 40, 'on_track',
 '2025-01-01', '2025-12-31', TRUE, 'fixed', 2000.00,
 TRUE, TRUE, TRUE, TRUE, TRUE, 100, NOW(), NOW());

-- 3. Inserir 3 Avaliações 360° de exemplo
INSERT INTO performanceEvaluations (
  employeeId, cycleId, type, status,
  selfEvaluationCompleted, managerEvaluationCompleted,
  peerEvaluationCompleted, subordinateEvaluationCompleted,
  createdAt, updatedAt
) VALUES
(@employee_id, @cycle_id, '360', 'pendente', FALSE, FALSE, FALSE, FALSE, NOW(), NOW()),
(@employee_id, @cycle_id, '360', 'em_andamento', TRUE, FALSE, FALSE, FALSE, NOW(), NOW()),
(@employee_id, @cycle_id, '360', 'concluida', TRUE, TRUE, TRUE, TRUE, NOW(), NOW());

-- 4. Inserir 2 PDIs de exemplo
INSERT INTO developmentPlans (
  employeeId, title, description, status, duration,
  objectives, actions, startDate, endDate,
  createdAt, updatedAt
) VALUES
(@employee_id, 'Desenvolvimento em Liderança Estratégica',
 'Plano focado em desenvolver competências de liderança estratégica e gestão de mudanças.',
 'em_andamento', 12,
 'Desenvolver visão estratégica, melhorar comunicação executiva, liderar projetos de transformação.',
 '70% Experiência: Liderar 3 projetos estratégicos | 20% Relacionamento: Mentorias com C-Level | 10% Educação: MBA Executivo',
 '2025-01-01', '2025-12-31', NOW(), NOW()),

(@employee_id, 'Especialização Técnica em Data Analytics',
 'Desenvolvimento de competências avançadas em análise de dados e BI.',
 'aprovado', 6,
 'Dominar Power BI, Python para análise de dados e storytelling com dados.',
 '70% Experiência: Criar 10 dashboards estratégicos | 20% Relacionamento: Networking com analistas sênior | 10% Educação: Certificação Power BI',
 '2025-01-01', '2025-06-30', NOW(), NOW());

-- Confirmar inserções
SELECT 'Dados inseridos com sucesso!' AS resultado;
SELECT COUNT(*) AS total_metas FROM smartGoals;
SELECT COUNT(*) AS total_avaliacoes FROM performanceEvaluations;
SELECT COUNT(*) AS total_pdis FROM developmentPlans;
