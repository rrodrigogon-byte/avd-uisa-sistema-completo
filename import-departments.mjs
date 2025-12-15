import { drizzle } from "drizzle-orm/mysql2";
import { departments } from "./drizzle/schema.js";
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

    // Importar departamentos em lote
    for (const dept of data) {
      try {
        // Determinar o nível hierárquico baseado no código
        const level = dept.code.split(".").filter((p) => p.length > 0).length;

        // Extrair código do pai (se existir)
        let parentCode = null;
        if (level > 1) {
          const parts = dept.code.split(".");
          parts.pop(); // Remove último segmento
          parentCode = parts.join(".");
        }

        await db.insert(departments).values({
          code: dept.code,
          name: dept.description,
          parentCode: parentCode,
          level: level,
          isActive: true,
        });

        imported++;
        if (imported % 50 === 0) {
          console.log(`✅ Importados ${imported} departamentos...`);
        }
      } catch (error) {
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

    const byLevel = {};
    allDepts.forEach((d) => {
      byLevel[d.level] = (byLevel[d.level] || 0) + 1;
    });

    console.log("\n📊 Distribuição por nível:");
    Object.keys(byLevel)
      .sort()
      .forEach((level) => {
        console.log(`   Nível ${level}: ${byLevel[level]} departamentos`);
      });
  } catch (error) {
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
