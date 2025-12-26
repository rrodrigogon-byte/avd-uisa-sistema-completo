import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { mysqlTable, varchar, text, int, timestamp, boolean, date, datetime, json, mysqlEnum } from "drizzle-orm/mysql-core";

// Definir schemas inline para evitar problemas com TypeScript
const employees = mysqlTable("employees", {
  id: int("id").primaryKey().autoincrement(),
  employeeCode: varchar("employeeCode", { length: 50 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  cpf: varchar("cpf", { length: 14 }),
  departmentId: int("departmentId"),
  positionId: int("positionId"),
  managerId: int("managerId"),
  status: varchar("status", { length: 50 }),
});

const departments = mysqlTable("departments", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }),
});

const positions = mysqlTable("positions", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }),
});

async function testEmployeesAPI() {
  console.log("🔍 Testando API de Funcionários...\n");

  try {
    // Conectar ao banco
    const db = drizzle(process.env.DATABASE_URL);
    console.log("✅ Conexão com banco estabelecida");

    // 1. Contar funcionários
    const allEmployees = await db.select().from(employees);
    console.log(`\n📊 Total de funcionários no banco: ${allEmployees.length}`);

    if (allEmployees.length === 0) {
      console.log("❌ Nenhum funcionário encontrado no banco!");
      return;
    }

    // 2. Buscar primeiros 5 funcionários com joins
    console.log("\n🔍 Buscando primeiros 5 funcionários com departamento e cargo...");
    const employeesWithDetails = await db
      .select({
        employee: employees,
        department: departments,
        position: positions,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .limit(5);

    console.log(`\n✅ Encontrados ${employeesWithDetails.length} funcionários:`);
    
    employeesWithDetails.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.employee.name}`);
      console.log(`   ID: ${item.employee.id}`);
      console.log(`   Email: ${item.employee.email || 'N/A'}`);
      console.log(`   Matrícula: ${item.employee.employeeCode || 'N/A'}`);
      console.log(`   Departamento: ${item.department?.name || 'N/A'}`);
      console.log(`   Cargo: ${item.position?.title || 'N/A'}`);
      console.log(`   Status: ${item.employee.status || 'N/A'}`);
    });

    // 3. Testar estrutura flat (como retorna listEmployees)
    console.log("\n\n🔄 Testando transformação para estrutura flat...");
    const flatEmployees = employeesWithDetails.map((row) => ({
      ...row.employee,
      departmentName: row.department?.name || null,
      positionName: row.position?.title || null,
    }));

    console.log(`\n✅ Estrutura flat criada com sucesso:`);
    flatEmployees.forEach((emp, index) => {
      console.log(`\n${index + 1}. ${emp.name}`);
      console.log(`   departmentName: ${emp.departmentName}`);
      console.log(`   positionName: ${emp.positionName}`);
    });

    // 4. Verificar hierarquia (managerId)
    console.log("\n\n👥 Verificando hierarquia (managerId)...");
    const employeesWithManagers = allEmployees.filter(emp => emp.managerId);
    console.log(`✅ ${employeesWithManagers.length} funcionários têm líder definido`);
    
    if (employeesWithManagers.length > 0) {
      const sample = employeesWithManagers[0];
      const manager = allEmployees.find(e => e.id === sample.managerId);
      console.log(`\nExemplo de hierarquia:`);
      console.log(`  Funcionário: ${sample.name} (ID: ${sample.id})`);
      console.log(`  Líder: ${manager?.name || 'Não encontrado'} (ID: ${sample.managerId})`);
    }

    console.log("\n\n✅ TESTE CONCLUÍDO COM SUCESSO!");

  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error);
    console.error("\nStack trace:", error.stack);
  }
}

testEmployeesAPI();
