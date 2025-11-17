import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import XLSX from "xlsx";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar ao banco
const db = drizzle(process.env.DATABASE_URL!);

async function importFromExcel() {
  console.log("🚀 Iniciando importação de dados dos arquivos Excel...\n");

  try {
    // Ler arquivo de seções
    const sectionsPath = "/home/ubuntu/upload/secoes.xlsx";
    console.log(`📁 Lendo arquivo: ${sectionsPath}`);
    const sectionsWorkbook = XLSX.readFile(sectionsPath);
    const sectionsSheet = sectionsWorkbook.Sheets[sectionsWorkbook.SheetNames[0]];
    const sectionsData = XLSX.utils.sheet_to_json(sectionsSheet);
    
    console.log(`   ✅ ${sectionsData.length} seções encontradas\n`);

    // Ler arquivo de funcionários
    const employeesPath = "/home/ubuntu/upload/funcionarios.xlsx";
    console.log(`📁 Lendo arquivo: ${employeesPath}`);
    const employeesWorkbook = XLSX.readFile(employeesPath);
    const employeesSheet = employeesWorkbook.Sheets[employeesWorkbook.SheetNames[0]];
    const employeesData = XLSX.utils.sheet_to_json(employeesSheet);
    
    console.log(`   ✅ ${employeesData.length} funcionários encontrados\n`);

    // 1. Importar departamentos
    console.log("📁 Importando departamentos...");
    let departmentCount = 0;
    const departmentMap = new Map<string, number>();

    for (const row of sectionsData as any[]) {
      const code = row['Código'] || row['Codigo'] || row['CÓDIGO'] || row['CODIGO'];
      const name = row['Descrição'] || row['Descricao'] || row['DESCRIÇÃO'] || row['DESCRICAO'] || row['Nome'] || row['NOME'];
      
      if (!code || !name) continue;

      try {
        const result = await db.insert(schema.departments).values({
          name: String(name).trim(),
          code: String(code).trim(),
        }).onDuplicateKeyUpdate({
          set: { name: String(name).trim() },
        });
        
        // Buscar ID do departamento criado
        const [dept] = await db.select().from(schema.departments).where(
          eq(schema.departments.code, String(code).trim())
        ).limit(1);
        
        if (dept) {
          departmentMap.set(String(code).trim(), dept.id);
        }
        
        departmentCount++;
      } catch (error: any) {
        console.error(`   ❌ Erro ao importar departamento ${name}:`, error.message);
      }
    }
    console.log(`   ✅ ${departmentCount} departamentos importados\n`);

    // 2. Criar cargos únicos
    console.log("💼 Processando cargos...");
    const uniquePositions = new Map<string, any>();
    
    for (const row of employeesData as any[]) {
      const position = row['Cargo'] || row['CARGO'] || row['cargo'];
      if (position && !uniquePositions.has(String(position).trim())) {
        const posTitle = String(position).trim();
        uniquePositions.set(posTitle, {
          code: posTitle.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase(),
          title: posTitle,
          level: "junior",
          description: null,
        });
      }
    }

    let positionCount = 0;
    const positionMap = new Map<string, number>();

    for (const [title, posData] of uniquePositions) {
      try {
        await db.insert(schema.positions).values(posData).onDuplicateKeyUpdate({
          set: { title: posData.title, code: posData.code },
        });
        
        // Buscar ID do cargo criado
        const [pos] = await db.select().from(schema.positions).where(
          eq(schema.positions.title, title)
        ).limit(1);
        
        if (pos) {
          positionMap.set(title, pos.id);
        }
        
        positionCount++;
      } catch (error: any) {
        console.error(`   ❌ Erro ao importar cargo ${title}:`, error.message);
      }
    }
    console.log(`   ✅ ${positionCount} cargos importados\n`);

    // 3. Importar funcionários
    console.log("👥 Importando funcionários...");
    let employeeCount = 0;
    let errorCount = 0;

    for (const row of employeesData as any[]) {
      try {
        const chapa = row['Chapa'] || row['CHAPA'] || row['chapa'];
        const name = row['Nome'] || row['NOME'] || row['nome'];
        const position = row['Cargo'] || row['CARGO'] || row['cargo'];
        const sectionCode = row['Seção'] || row['SEÇÃO'] || row['secao'] || row['Secao'];
        const emailCorp = row['E-mail Corporativo'] || row['Email Corporativo'] || row['email_corporativo'];
        const emailPers = row['E-mail Pessoal'] || row['Email Pessoal'] || row['email_pessoal'];
        const phone = row['Telefone'] || row['TELEFONE'] || row['telefone'];

        if (!chapa || !name) {
          continue;
        }

        const departmentId = sectionCode ? departmentMap.get(String(sectionCode).trim()) : null;
        const positionId = position ? positionMap.get(String(position).trim()) : null;

        await db.insert(schema.employees).values({
          employeeCode: String(chapa).trim(),
          name: String(name).trim(),
          email: emailCorp ? String(emailCorp).trim() : "sem-email@uisa.com.br",
          hireDate: new Date(),
          departmentId: departmentId || 1,
          positionId: positionId || 1,
          phone: phone ? String(phone).trim() : null,
          status: "ativo",
        }).onDuplicateKeyUpdate({
          set: {
            name: String(name).trim(),
            email: emailCorp ? String(emailCorp).trim() : "sem-email@uisa.com.br",
          },
        });

        employeeCount++;

        if (employeeCount % 100 === 0) {
          console.log(`   📝 ${employeeCount} funcionários processados...`);
        }
      } catch (error: any) {
        errorCount++;
        if (errorCount <= 10) {
          console.error(`   ❌ Erro ao importar funcionário:`, error.message);
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

importFromExcel()
  .then(() => {
    console.log("\n🎉 Processo finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });
