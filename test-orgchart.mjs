import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Buscar funcionários
const [employees] = await connection.query(`
  SELECT 
    e.id,
    e.name,
    e.employeeCode,
    e.managerId,
    e.departmentId,
    d.name as departmentName,
    e.positionId,
    p.title as positionTitle,
    e.active
  FROM employees e
  LEFT JOIN departments d ON e.departmentId = d.id
  LEFT JOIN positions p ON e.positionId = p.id
  WHERE e.active = 1
  LIMIT 20
`);

console.log("\n=== FUNCIONÁRIOS NO BANCO ===");
console.log(`Total de funcionários ativos: ${employees.length}\n`);

employees.forEach((emp) => {
  console.log(`ID: ${emp.id} | Nome: ${emp.name} | Gestor: ${emp.managerId || "SEM GESTOR"} | Depto: ${emp.departmentName || "N/A"}`);
});

// Verificar hierarquia
const [hierarchy] = await connection.query(`
  SELECT 
    managerId,
    COUNT(*) as subordinados
  FROM employees
  WHERE active = 1
  GROUP BY managerId
  ORDER BY subordinados DESC
`);

console.log("\n=== HIERARQUIA ===");
hierarchy.forEach((h) => {
  console.log(`Gestor ID ${h.managerId || "NULL (Topo)"}: ${h.subordinados} subordinados`);
});

await connection.end();
