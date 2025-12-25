import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar ao banco
const db = drizzle(process.env.DATABASE_URL!);

async function importData() {
  console.log("🚀 Iniciando importação de dados reais...\n");

  try {
    // Ler arquivos JSON processados
    const departmentsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/departments.json"), "utf-8")
    );
    const employeesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/employees.json"), "utf-8")
    );

    console.log(`📊 Dados carregados:`);
    console.log(`   - ${departmentsData.length} departamentos`);
    console.log(`   - ${employeesData.length} funcionários\n`);

    // 1. Importar departamentos
    console.log("📁 Importando departamentos...");
    let departmentCount = 0;
    for (const dept of departmentsData) {
      try {
        await db.insert(schema.departments).values({
          name: dept.name,
          code: dept.code,
        }).onDuplicateKeyUpdate({
          set: { name: dept.name },
        });
        departmentCount++;
      } catch (error: any) {
        console.error(`   ❌ Erro ao importar departamento ${dept.name}:`, error.message);
      }
    }
    console.log(`   ✅ ${departmentCount} departamentos importados\n`);

    // 2. Buscar IDs dos departamentos criados
    const departments = await db.select().from(schema.departments);
    const departmentMap = new Map(departments.map(d => [d.code, d.id]));

    // 3. Criar cargos únicos e importar
    console.log("💼 Importando cargos...");
    const uniquePositions = new Map<string, any>();
    
    for (const emp of employeesData) {
      if (emp.position && !uniquePositions.has(emp.position)) {
        uniquePositions.set(emp.position, {
          title: emp.position,
          level: "operacional", // Valor padrão do enum
          description: null,
        });
      }
    }

    let positionCount = 0;
    for (const [title, posData] of uniquePositions) {
      try {
        await db.insert(schema.positions).values(posData).onDuplicateKeyUpdate({
          set: { title: posData.title },
        });
        positionCount++;
      } catch (error: any) {
        console.error(`   ❌ Erro ao importar cargo ${title}:`, error.message);
      }
    }
    console.log(`   ✅ ${positionCount} cargos importados\n`);

    // 4. Buscar IDs dos cargos criados
    const positions = await db.select().from(schema.positions);
    const positionMap = new Map(positions.map(p => [p.title, p.id]));

    // 5. Importar funcionários
    console.log("👥 Importando funcionários...");
    let employeeCount = 0;
    let errorCount = 0;

    for (const emp of employeesData) {
      try {
        const departmentId = emp.department_code ? departmentMap.get(emp.department_code) : null;
        const positionId = emp.position ? positionMap.get(emp.position) : null;

        await db.insert(schema.employees).values({
          chapa: emp.chapa,
          name: emp.name,
          email: emp.email_corporate || null,
          personalEmail: emp.email_personal || null,
          phone: emp.phone || null,
          departmentId: departmentId || null,
          positionId: positionId || null,
          admissionDate: null,
          status: "ativo",
        }).onDuplicateKeyUpdate({
          set: {
            name: emp.name,
            email: emp.email_corporate || null,
          },
        });

        employeeCount++;

        if (employeeCount % 100 === 0) {
          console.log(`   📝 ${employeeCount} funcionários processados...`);
        }
      } catch (error: any) {
        errorCount++;
        if (errorCount <= 10) {
          console.error(`   ❌ Erro ao importar funcionário ${emp.name}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Importação concluída!`);
    console.log(`   - ${departmentCount} departamentos`);
    console.log(`   - ${positionCount} cargos`);
    console.log(`   - ${employeeCount} funcionários`);
    if (errorCount > 0) {
      console.log(`   - ${errorCount} erros encontrados`);
    }

  } catch (error) {
    console.error("\n❌ Erro fatal na importação:", error);
    process.exit(1);
  }
}

importData()
  .then(() => {
    console.log("\n🎉 Processo finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });
