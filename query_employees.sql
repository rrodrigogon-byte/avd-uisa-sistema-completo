SELECT id, name, email, managerId, departmentId, gerencia, diretoria, active 
FROM employees 
WHERE name LIKE '%Geane%' 
   OR name LIKE '%Rodrigo%' 
   OR name LIKE '%Mazuca%' 
   OR name LIKE '%Conselho%'
   OR gerencia LIKE '%Geo%'
   OR diretoria LIKE '%Geo%'
   OR secao LIKE '%Geo%'
ORDER BY name;
