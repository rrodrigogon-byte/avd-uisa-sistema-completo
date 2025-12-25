-- ============================================================================
-- VINCULAÇÃO DE COMPETÊNCIAS AOS CARGOS
-- Sistema AVD - Avaliação de Desempenho
-- ============================================================================

-- COMPETÊNCIAS CORE (aplicáveis a TODOS os cargos)
-- Nível exigido varia conforme hierarquia do cargo

-- Para cargos de DIRETORIA (nível 5 - Expert)
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    5,
    10
FROM positions p
CROSS JOIN competencies c
WHERE p.title LIKE '%Diretor%'
AND c.code IN ('COMP_001', 'COMP_002', 'COMP_003', 'COMP_005', 'COMP_008', 'COMP_009', 'COMP_010');

-- Para cargos de GERÊNCIA (nível 4 - Especialista)
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    9
FROM positions p
CROSS JOIN competencies c
WHERE p.title LIKE '%Gerente%'
AND c.code IN ('COMP_001', 'COMP_002', 'COMP_003', 'COMP_004', 'COMP_005', 'COMP_008', 'COMP_009', 'COMP_010');

-- Para cargos de COORDENAÇÃO (nível 3 - Avançado)
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    3,
    8
FROM positions p
CROSS JOIN competencies c
WHERE p.title LIKE '%Coordenador%'
AND c.code IN ('COMP_001', 'COMP_002', 'COMP_003', 'COMP_004', 'COMP_005', 'COMP_008');

-- Para cargos de ANALISTA/ESPECIALISTA (nível 3 - Avançado)
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    3,
    7
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Analista%' OR p.title LIKE '%Especialista%')
AND c.code IN ('COMP_001', 'COMP_002', 'COMP_004', 'COMP_005', 'COMP_006', 'COMP_007', 'COMP_008');

-- Para cargos de ASSISTENTE/AUXILIAR (nível 2 - Intermediário)
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    2,
    5
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Assistente%' OR p.title LIKE '%Auxiliar%')
AND c.code IN ('COMP_001', 'COMP_002', 'COMP_005', 'COMP_006', 'COMP_008');

-- Para cargos OPERACIONAIS (nível 2 - Intermediário)
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    2,
    5
FROM positions p
CROSS JOIN competencies c
WHERE p.title LIKE '%Operador%'
AND c.code IN ('COMP_001', 'COMP_002', 'COMP_005', 'COMP_008');

-- COMPETÊNCIAS TÉCNICAS ESPECÍFICAS POR ÁREA

-- PRODUÇÃO INDUSTRIAL
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Produção%' OR p.title LIKE '%Fabricação%' OR p.title LIKE '%Industrial%')
AND c.code IN ('COMP_011', 'COMP_012', 'COMP_013', 'COMP_014', 'COMP_015', 'COMP_016');

-- AGRÍCOLA
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Agrícola%' OR p.title LIKE '%Agronôm%' OR p.title LIKE '%Colheita%' OR p.title LIKE '%Plantio%')
AND c.code IN ('COMP_017', 'COMP_018', 'COMP_019', 'COMP_020', 'COMP_021');

-- SEGURANÇA DO TRABALHO
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    5,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Segurança%' OR p.title LIKE '%SST%')
AND c.code IN ('COMP_022', 'COMP_023', 'COMP_024', 'COMP_025');

-- QUALIDADE E MEIO AMBIENTE
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Qualidade%' OR p.title LIKE '%Ambiental%' OR p.title LIKE '%Meio Ambiente%')
AND c.code IN ('COMP_026', 'COMP_027', 'COMP_028', 'COMP_029');

-- LOGÍSTICA
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Logística%' OR p.title LIKE '%Armazenamento%' OR p.title LIKE '%Carregamento%' OR p.title LIKE '%Transporte%')
AND c.code IN ('COMP_030', 'COMP_031', 'COMP_032', 'COMP_033');

-- RECURSOS HUMANOS
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Recursos Humanos%' OR p.title LIKE '%RH%' OR p.title LIKE '%Pessoal%')
AND c.code IN ('COMP_034', 'COMP_035', 'COMP_036', 'COMP_037');

-- FINANCEIRO E CONTROLADORIA
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Financeiro%' OR p.title LIKE '%Controladoria%' OR p.title LIKE '%Contábil%')
AND c.code IN ('COMP_038', 'COMP_039', 'COMP_040', 'COMP_041');

-- ENGENHARIA E PROJETOS
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Engenharia%' OR p.title LIKE '%Engenheiro%' OR p.title LIKE '%Projeto%')
AND c.code IN ('COMP_042', 'COMP_043', 'COMP_044', 'COMP_045');

-- TECNOLOGIA DA INFORMAÇÃO
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%TI%' OR p.title LIKE '%Tecnologia%' OR p.title LIKE '%Informática%' OR p.title LIKE '%Sistemas%')
AND c.code IN ('COMP_046', 'COMP_047', 'COMP_048', 'COMP_049');

-- COMERCIAL E VENDAS
INSERT INTO positionCompetencies (positionId, competencyId, requiredLevel, weight)
SELECT 
    p.id,
    c.id,
    4,
    10
FROM positions p
CROSS JOIN competencies c
WHERE (p.title LIKE '%Comercial%' OR p.title LIKE '%Vendas%' OR p.title LIKE '%Negócios%')
AND c.code IN ('COMP_050', 'COMP_051', 'COMP_052');
