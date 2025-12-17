/**
 * Script de Importação em Lote de Funcionários
 * Importa todos os 2.889 funcionários do arquivo imported_employees.json
 */

import { drizzle } from "drizzle-orm/mysql2";
import { employees } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EmployeeData {
  id: number;
  employee_code: string;
  name: string;
  position: string;
  department: string;
  corporate_email: string;
  personal_email: string;
  phone: string;
  active: boolean;
}

async function importEmployees() {
  console.log("🚀 Iniciando importação de funcionários...");

  // Conectar ao banco
  const db = drizzle(process.env.DATABASE_URL!);

  // Ler arquivo JSON
  const filePath = path.join(__dirname, "imported_employees.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const employeesData: EmployeeData[] = JSON.parse(fileContent);

  console.log(`📊 Total de funcionários no arquivo: ${employeesData.length}`);

  // Verificar quantos já existem no banco
  const existingEmployees = await db.select().from(employees);
  console.log(`📊 Funcionários já no banco: ${existingEmployees.length}`);

  // Filtrar funcionários que ainda não foram importados
  const existingCodes = new Set(existingEmployees.map(e => e.employeeCode));
  const newEmployees = employeesData.filter(
    emp => !existingCodes.has(emp.employee_code)
  );

  console.log(`📥 Funcionários a importar: ${newEmployees.length}`);

  if (newEmployees.length === 0) {
    console.log("✅ Todos os funcionários já foram importados!");
    return;
  }

  // Importar em lotes de 100
  const BATCH_SIZE = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < newEmployees.length; i += BATCH_SIZE) {
    const batch = newEmployees.slice(i, i + BATCH_SIZE);
    
    try {
      const values = batch.map(emp => ({
        employeeCode: emp.employee_code,
        name: emp.name,
        cargo: emp.position,
        secao: emp.department,
        corporateEmail: emp.corporate_email || null,
        personalEmail: emp.personal_email || null,
        telefone: emp.phone || null,
        active: emp.active,
      }));

      await db.insert(employees).values(values);
      imported += batch.length;
      
      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} funcionários importados (Total: ${imported}/${newEmployees.length})`);
    } catch (error) {
      errors += batch.length;
      console.error(`❌ Erro ao importar lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
    }
  }

  console.log("\n📊 RESUMO DA IMPORTAÇÃO:");
  console.log(`✅ Importados com sucesso: ${imported}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📊 Total no banco após importação: ${existingEmployees.length + imported}`);
}

// Executar importação
importEmployees()
  .then(() => {
    console.log("\n✅ Importação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal na importação:", error);
    process.exit(1);
  });
