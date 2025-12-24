import json

# Simular dados que precisamos buscar via procedure tRPC
# Vou criar uma procedure para buscar esses dados

query = """
SELECT 
  e.id,
  e.name,
  e.email,
  e.managerId,
  m.name as managerName,
  e.gerencia,
  e.diretoria,
  e.secao,
  e.active
FROM employees e
LEFT JOIN employees m ON e.managerId = m.id
WHERE e.name LIKE '%Geane%' 
   OR e.name LIKE '%Rodrigo%' 
   OR e.name LIKE '%Mazuca%' 
   OR e.name LIKE '%Conselho%'
   OR e.gerencia LIKE '%Geo%'
   OR e.diretoria LIKE '%Geo%'
   OR e.secao LIKE '%Geo%'
ORDER BY e.name;
"""

print("Query para buscar funcionários:")
print(query)
print("\nPróximos passos:")
print("1. Criar procedure tRPC para buscar esses dados")
print("2. Identificar IDs de Geane, Rodrigo, Mazuca, Conselho")
print("3. Ajustar managerId de Geane para apontar para Rodrigo")
print("4. Reposicionar Conselho na hierarquia acima de Mazuca")
print("5. Desativar (soft delete) profissionais de Geo")
