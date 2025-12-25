-- ============================================================================
-- MATRIZ 9-BOX E PROCESSO DE SUCESSÃO
-- Sistema AVD - Avaliação de Desempenho
-- ============================================================================

-- POSICIONAMENTO NA MATRIZ 9-BOX
-- Performance: 1 (baixo), 2 (médio), 3 (alto)
-- Potential: 1 (baixo), 2 (médio), 3 (alto)

-- Criar posicionamento 9-Box para colaborador admin (Alto Desempenho × Alto Potencial)
INSERT INTO nineBoxPositions (employeeId, cycleId, performance, potential, box, calibrated, notes)
VALUES (
  (SELECT id FROM employees WHERE employeeCode = 'ADMIN001'),
  1,
  3, -- Alto desempenho
  3, -- Alto potencial
  'alto_alto', -- Quadrante: Estrela/Talento
  true,
  'Colaborador de alto desempenho e potencial. Candidato forte para sucessão em cargos de liderança.'
);

-- PLANOS DE SUCESSÃO PARA CARGOS CRÍTICOS

-- Identificar cargos críticos de liderança (Diretores)
INSERT INTO successionPlans (positionId, isCritical, riskLevel, status, notes)
SELECT 
  id,
  true,
  'alto',
  'ativo',
  CONCAT('Plano de sucessão para cargo crítico: ', title)
FROM positions
WHERE title LIKE '%Diretor%'
LIMIT 5;

-- Identificar cargos críticos de liderança (Gerentes)
INSERT INTO successionPlans (positionId, isCritical, riskLevel, status, notes)
SELECT 
  id,
  true,
  'medio',
  'ativo',
  CONCAT('Plano de sucessão para cargo crítico: ', title)
FROM positions
WHERE title LIKE '%Gerente%'
LIMIT 10;

-- CANDIDATOS A SUCESSÃO

-- Vincular colaborador admin como candidato a sucessão
INSERT INTO successionCandidates (planId, employeeId, readinessLevel, priority, notes)
SELECT 
  sp.id,
  (SELECT id FROM employees WHERE employeeCode = 'ADMIN001'),
  '1_ano',
  1,
  'Candidato com forte potencial técnico e comportamental'
FROM successionPlans sp
LIMIT 3;

-- EXEMPLOS DE POSICIONAMENTO 9-BOX (DIVERSOS QUADRANTES)

-- Exemplo: Médio Desempenho × Alto Potencial (Enigma/Potencial Inexplorado)
INSERT INTO nineBoxPositions (employeeId, cycleId, performance, potential, box, calibrated, notes)
SELECT 
  id,
  1,
  2, -- Médio desempenho
  3, -- Alto potencial
  'medio_alto',
  false,
  'Colaborador com alto potencial que precisa melhorar desempenho atual'
FROM employees
WHERE departmentId = 1
LIMIT 5;

-- Exemplo: Alto Desempenho × Médio Potencial (Profissional Sólido)
INSERT INTO nineBoxPositions (employeeId, cycleId, performance, potential, box, calibrated, notes)
SELECT 
  id,
  1,
  3, -- Alto desempenho
  2, -- Médio potencial
  'alto_medio',
  true,
  'Profissional sólido e confiável, especialista técnico'
FROM employees
WHERE departmentId = 2
LIMIT 5;

-- Exemplo: Baixo Desempenho × Baixo Potencial (Necessita Ação Urgente)
INSERT INTO nineBoxPositions (employeeId, cycleId, performance, potential, box, calibrated, notes)
SELECT 
  id,
  1,
  1, -- Baixo desempenho
  1, -- Baixo potencial
  'baixo_baixo',
  false,
  'Necessita plano de melhoria urgente ou desligamento'
FROM employees
WHERE departmentId = 3
LIMIT 2;
