-- ============================================================================
-- NÍVEIS DE PROFICIÊNCIA DAS COMPETÊNCIAS
-- Sistema AVD - Avaliação de Desempenho
-- ============================================================================

-- Criar níveis de proficiência para cada competência (1-5)
-- Nível 1: Básico/Iniciante
-- Nível 2: Intermediário
-- Nível 3: Avançado
-- Nível 4: Especialista
-- Nível 5: Referência/Expert

-- Gerar níveis para todas as 52 competências
INSERT INTO competencyLevels (competencyId, level, name, description)
SELECT 
    c.id,
    1,
    'Básico',
    CONCAT('Nível básico de ', c.name, '. Conhecimento inicial, requer supervisão constante.')
FROM competencies c;

INSERT INTO competencyLevels (competencyId, level, name, description)
SELECT 
    c.id,
    2,
    'Intermediário',
    CONCAT('Nível intermediário de ', c.name, '. Conhecimento funcional, requer supervisão ocasional.')
FROM competencies c;

INSERT INTO competencyLevels (competencyId, level, name, description)
SELECT 
    c.id,
    3,
    'Avançado',
    CONCAT('Nível avançado de ', c.name, '. Autonomia completa, capaz de orientar outros.')
FROM competencies c;

INSERT INTO competencyLevels (competencyId, level, name, description)
SELECT 
    c.id,
    4,
    'Especialista',
    CONCAT('Nível especialista de ', c.name, '. Domínio profundo, referência na área.')
FROM competencies c;

INSERT INTO competencyLevels (competencyId, level, name, description)
SELECT 
    c.id,
    5,
    'Expert',
    CONCAT('Nível expert de ', c.name, '. Autoridade no tema, capaz de inovar e desenvolver novos conhecimentos.')
FROM competencies c;
