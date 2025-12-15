import { drizzle } from "drizzle-orm/mysql2";
import { departments } from "./drizzle/schema";
import fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está configurada");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function importDepartments() {
  console.log("🚀 Iniciando importação de departamentos...\n");

  try {
    // Ler dados do arquivo JSON
    const data = JSON.parse(
      fs.readFileSync("/home/ubuntu/departments_data.json", "utf-8")
    );

    console.log(`📊 Total de departamentos a importar: ${data.length}\n`);

    let imported = 0;
    let errors = 0;

    // Primeiro, criar um mapa de códigos para IDs
    const codeToIdMap: Record<string, number> = {};

    // Importar departamentos em ordem (pais antes dos filhos)
    const sortedData = data.sort((a: any, b: any) => {
      const aLevel = a.code.split(".").filter((p: string) => p.length > 0).length;
      const bLevel = b.code.split(".").filter((p: string) => p.length > 0).length;
      return aLevel - bLevel;
    });

    for (const dept of sortedData) {
      try {
        // Extrair código do pai (se existir)
        let parentId: number | null = null;
        const parts = dept.code.split(".");
        if (parts.length > 1) {
          parts.pop(); // Remove último segmento
          const parentCode = parts.join(".");
          parentId = codeToIdMap[parentCode] || null;
        }

        const result = await db.insert(departments).values({
          code: dept.code,
          name: dept.description,
          parentId: parentId,
          active: true,
        });

        // Armazenar o ID gerado para referências futuras
        // @ts-ignore - insertId existe no resultado
        codeToIdMap[dept.code] = Number(result.insertId);

        imported++;
        if (imported % 50 === 0) {
          console.log(`✅ Importados ${imported} departamentos...`);
        }
      } catch (error: any) {
        errors++;
        console.error(
          `❌ Erro ao importar ${dept.code}: ${error.message}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Importação concluída!`);
    console.log(`   Total: ${data.length}`);
    console.log(`   Sucesso: ${imported}`);
    console.log(`   Erros: ${errors}`);
    console.log("=".repeat(60));

    // Verificar hierarquia
    console.log("\n🔍 Verificando hierarquia...");
    const allDepts = await db.select().from(departments);
    console.log(`   Total no banco: ${allDepts.length}`);

    // Contar departamentos por nível hierárquico
    const byLevel: Record<number, number> = {};
    allDepts.forEach((d) => {
      const level = d.code.split(".").filter((p: string) => p.length > 0).length;
      byLevel[level] = (byLevel[level] || 0) + 1;
    });

    console.log("\n📊 Distribuição por nível hierárquico:");
    Object.keys(byLevel)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((level) => {
        console.log(`   Nível ${level}: ${byLevel[Number(level)]} departamentos`);
      });

    // Mostrar alguns exemplos
    console.log("\n📋 Exemplos de departamentos importados:");
    const samples = allDepts.slice(0, 5);
    samples.forEach(d => {
      const parentInfo = d.parentId ? `(pai: ID ${d.parentId})` : "(raiz)";
      console.log(`   ${d.code} - ${d.name} ${parentInfo}`);
    });
  } catch (error: any) {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  }
}

importDepartments()
  .then(() => {
    console.log("\n✅ Script finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro ao executar script:", error);
    process.exit(1);
  });
