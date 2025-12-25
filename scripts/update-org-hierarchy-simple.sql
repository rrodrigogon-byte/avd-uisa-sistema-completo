-- Script para atualizar hierarquia organizacional
-- Hierarquia: Jacyr (Presidente) → Mazuca (CEO) → Rodrigo Gonçalves → Maria Geane

-- 1. Criar/atualizar Jacyr (Presidente do Conselho) - topo da hierarquia
INSERT INTO employees (employeeCode, name, email, cargo, chapa, managerId, active)
VALUES ('PRES001', 'Jacyr', 'jacyr@uisa.com.br', 'Presidente do Conselho', 'PRES001', NULL, 1)
ON DUPLICATE KEY UPDATE 
  cargo = 'Presidente do Conselho',
  managerId = NULL,
  email = 'jacyr@uisa.com.br';

-- 2. Criar/atualizar Mazuca (CEO) - reporta a Jacyr
INSERT INTO employees (employeeCode, name, email, cargo, chapa, managerId, active)
VALUES ('CEO001', 'Mazuca', 'mazuca@uisa.com.br', 'CEO', 'CEO001', 
  (SELECT id FROM (SELECT id FROM employees WHERE name = 'Jacyr' LIMIT 1) AS tmp), 1)
ON DUPLICATE KEY UPDATE 
  cargo = 'CEO',
  managerId = (SELECT id FROM (SELECT id FROM employees WHERE name = 'Jacyr' LIMIT 1) AS tmp),
  email = 'mazuca@uisa.com.br';

-- 3. Criar/atualizar Rodrigo Gonçalves - reporta a Mazuca
INSERT INTO employees (employeeCode, name, email, cargo, chapa, managerId, active)
VALUES ('DIR001', 'Rodrigo Gonçalves', 'rodrigo.goncalves@uisa.com.br', 'Diretor', 'DIR001', 
  (SELECT id FROM (SELECT id FROM employees WHERE name = 'Mazuca' LIMIT 1) AS tmp), 1)
ON DUPLICATE KEY UPDATE 
  managerId = (SELECT id FROM (SELECT id FROM employees WHERE name = 'Mazuca' LIMIT 1) AS tmp),
  email = 'rodrigo.goncalves@uisa.com.br';

-- 4. Criar/atualizar Maria Geane - reporta a Rodrigo Gonçalves
INSERT INTO employees (employeeCode, name, email, cargo, chapa, managerId, active)
VALUES ('GER001', 'Maria Geane', 'maria.geane@uisa.com.br', 'Gerente', 'GER001', 
  (SELECT id FROM (SELECT id FROM employees WHERE name = 'Rodrigo Gonçalves' LIMIT 1) AS tmp), 1)
ON DUPLICATE KEY UPDATE 
  managerId = (SELECT id FROM (SELECT id FROM employees WHERE name = 'Rodrigo Gonçalves' LIMIT 1) AS tmp),
  email = 'maria.geane@uisa.com.br';

-- Verificar a hierarquia criada
SELECT 
  e1.id, 
  e1.name, 
  e1.cargo, 
  e1.managerId,
  e2.name AS manager_name
FROM employees e1
LEFT JOIN employees e2 ON e1.managerId = e2.id
WHERE e1.name IN ('Jacyr', 'Mazuca', 'Rodrigo Gonçalves', 'Maria Geane')
ORDER BY 
  CASE 
    WHEN e1.name = 'Jacyr' THEN 1
    WHEN e1.name = 'Mazuca' THEN 2
    WHEN e1.name = 'Rodrigo Gonçalves' THEN 3
    WHEN e1.name = 'Maria Geane' THEN 4
  END;
