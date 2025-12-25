-- Script de Ajustes de Hierarquia Organizacional
-- Data: 24/12/2025
-- Solicitações:
-- 1. Geane ligada a Rodrigo
-- 2. Conselho acima de Mazuca na hierarquia
-- 3. Excluir profissionais de Geo

-- ============================================================================
-- PASSO 1: Identificar IDs dos funcionários mencionados
-- ============================================================================

-- Buscar Geane
SELECT id, name, managerId, gerencia, diretoria 
FROM employees 
WHERE name LIKE '%Geane%';

-- Buscar Rodrigo
SELECT id, name, managerId, gerencia, diretoria 
FROM employees 
WHERE name LIKE '%Rodrigo%';

-- Buscar Mazuca
SELECT id, name, managerId, gerencia, diretoria 
FROM employees 
WHERE name LIKE '%Mazuca%';

-- Buscar Conselho
SELECT id, name, managerId, gerencia, diretoria 
FROM employees 
WHERE name LIKE '%Conselho%';

-- ============================================================================
-- PASSO 2: Buscar profissionais de Geo
-- ============================================================================

SELECT id, name, email, gerencia, diretoria, secao, active
FROM employees
WHERE (gerencia LIKE '%Geo%' OR diretoria LIKE '%Geo%' OR secao LIKE '%Geo%')
  AND active = 1;

-- ============================================================================
-- PASSO 3: Ajustes de Hierarquia (EXECUTAR APÓS CONFIRMAR IDs)
-- ============================================================================

-- IMPORTANTE: Substitua os IDs abaixo pelos IDs reais encontrados nas queries acima

-- 3.1. Ajustar Geane para reportar a Rodrigo
-- UPDATE employees 
-- SET managerId = [ID_DO_RODRIGO]
-- WHERE id = [ID_DA_GEANE];

-- 3.2. Ajustar Conselho para ficar acima de Mazuca
-- Isso pode significar:
-- - Mazuca reportar ao Conselho, OU
-- - Conselho ter um nível hierárquico superior ao de Mazuca

-- Opção A: Mazuca reporta ao Conselho
-- UPDATE employees 
-- SET managerId = [ID_DO_CONSELHO]
-- WHERE id = [ID_DO_MAZUCA];

-- Opção B: Ajustar níveis hierárquicos
-- UPDATE employees 
-- SET hierarchyLevel = 'diretoria'
-- WHERE id = [ID_DO_CONSELHO];

-- UPDATE employees 
-- SET hierarchyLevel = 'gerencia'
-- WHERE id = [ID_DO_MAZUCA];

-- 3.3. Desativar profissionais de Geo (soft delete)
-- UPDATE employees
-- SET active = 0
-- WHERE (gerencia LIKE '%Geo%' OR diretoria LIKE '%Geo%' OR secao LIKE '%Geo%')
--   AND active = 1;

-- ============================================================================
-- PASSO 4: Registrar auditoria dos ajustes
-- ============================================================================

-- Após executar os ajustes, registrar na auditoria:
-- INSERT INTO auditLogs (userId, action, entity, entityId, changes, createdAt)
-- VALUES 
--   (1, 'hierarchy_adjustment', 'employee', [ID_DA_GEANE], '{"action": "manager_changed", "from": [OLD_MANAGER_ID], "to": [ID_DO_RODRIGO]}', NOW()),
--   (1, 'hierarchy_adjustment', 'employee', [ID_DO_MAZUCA], '{"action": "manager_changed", "from": [OLD_MANAGER_ID], "to": [ID_DO_CONSELHO]}', NOW()),
--   (1, 'bulk_deactivation', 'employee', NULL, '{"action": "deactivate_geo_professionals", "count": [QUANTIDADE]}', NOW());

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================

-- 1. Execute as queries do PASSO 1 e PASSO 2 para identificar os IDs
-- 2. Anote os IDs encontrados
-- 3. Descomente e ajuste as queries do PASSO 3 com os IDs corretos
-- 4. Execute os ajustes um por vez, verificando cada resultado
-- 5. Execute as queries de auditoria do PASSO 4

-- NOTA: Este script foi criado para documentação e execução manual segura.
-- Para execução automatizada, use a interface de Gerenciamento de Funcionários.
