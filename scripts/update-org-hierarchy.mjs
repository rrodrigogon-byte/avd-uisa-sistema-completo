import { drizzle } from "drizzle-orm/mysql2";
import { employees } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function updateOrgHierarchy() {
  console.log("🔄 Atualizando hierarquia organizacional...");

  try {
    // 1. Primeiro, vamos buscar ou criar Jacyr (Presidente do Conselho)
    let jacyr = await db.select().from(employees).where(eq(employees.name, "Jacyr")).limit(1);
    
    if (jacyr.length === 0) {
      console.log("📝 Criando registro de Jacyr (Presidente do Conselho)...");
      const [jacyrResult] = await db.insert(employees).values({
        name: "Jacyr",
        email: "jacyr@uisa.com.br",
        cargo: "Presidente do Conselho",
        chapa: "PRES001",
        departamento: "Conselho",
        managerId: null, // Topo da hierarquia
        active: true,
      });
      jacyr = await db.select().from(employees).where(eq(employees.id, jacyrResult.insertId));
    } else {
      console.log("✅ Jacyr já existe, atualizando dados...");
      await db.update(employees)
        .set({
          cargo: "Presidente do Conselho",
          managerId: null, // Topo da hierarquia
          departamento: "Conselho",
        })
        .where(eq(employees.id, jacyr[0].id));
    }
    const jacyrId = jacyr[0]?.id || jacyr.insertId;

    // 2. Buscar ou criar Mazuca (CEO)
    let mazuca = await db.select().from(employees).where(eq(employees.name, "Mazuca")).limit(1);
    
    if (mazuca.length === 0) {
      console.log("📝 Criando registro de Mazuca (CEO)...");
      const [mazucaResult] = await db.insert(employees).values({
        name: "Mazuca",
        email: "mazuca@uisa.com.br",
        cargo: "CEO",
        chapa: "CEO001",
        departamento: "Diretoria Executiva",
        managerId: jacyrId, // Reporta a Jacyr
        active: true,
      });
      mazuca = await db.select().from(employees).where(eq(employees.id, mazucaResult.insertId));
    } else {
      console.log("✅ Mazuca já existe, atualizando dados...");
      await db.update(employees)
        .set({
          cargo: "CEO",
          managerId: jacyrId, // Reporta a Jacyr
          departamento: "Diretoria Executiva",
        })
        .where(eq(employees.id, mazuca[0].id));
    }
    const mazucaId = mazuca[0]?.id || mazuca.insertId;

    // 3. Buscar ou criar Rodrigo Gonçalves
    let rodrigo = await db.select().from(employees)
      .where(eq(employees.name, "Rodrigo Gonçalves"))
      .limit(1);
    
    if (rodrigo.length === 0) {
      console.log("📝 Criando registro de Rodrigo Gonçalves...");
      const [rodrigoResult] = await db.insert(employees).values({
        name: "Rodrigo Gonçalves",
        email: "rodrigo.goncalves@uisa.com.br",
        cargo: "Diretor",
        chapa: "DIR001",
        departamento: "Diretoria",
        managerId: mazucaId, // Reporta a Mazuca
        active: true,
      });
      rodrigo = await db.select().from(employees).where(eq(employees.id, rodrigoResult.insertId));
    } else {
      console.log("✅ Rodrigo Gonçalves já existe, atualizando dados...");
      await db.update(employees)
        .set({
          managerId: mazucaId, // Reporta a Mazuca
        })
        .where(eq(employees.id, rodrigo[0].id));
    }
    const rodrigoId = rodrigo[0]?.id || rodrigo.insertId;

    // 4. Buscar ou criar Maria Geane
    let mariaGeane = await db.select().from(employees)
      .where(eq(employees.name, "Maria Geane"))
      .limit(1);
    
    if (mariaGeane.length === 0) {
      console.log("📝 Criando registro de Maria Geane...");
      await db.insert(employees).values({
        name: "Maria Geane",
        email: "maria.geane@uisa.com.br",
        cargo: "Gerente",
        chapa: "GER001",
        departamento: "Gerência",
        managerId: rodrigoId, // Reporta a Rodrigo Gonçalves
        active: true,
      });
    } else {
      console.log("✅ Maria Geane já existe, atualizando dados...");
      await db.update(employees)
        .set({
          managerId: rodrigoId, // Reporta a Rodrigo Gonçalves
        })
        .where(eq(employees.id, mariaGeane[0].id));
    }

    console.log("\n✅ Hierarquia atualizada com sucesso!");
    console.log("\n📊 Estrutura atual:");
    console.log("   Jacyr (Presidente do Conselho)");
    console.log("   └── Mazuca (CEO)");
    console.log("       └── Rodrigo Gonçalves (Diretor)");
    console.log("           └── Maria Geane (Gerente)");

    // Verificar a hierarquia
    const allLeaders = await db.select().from(employees)
      .where(eq(employees.name, "Jacyr"))
      .limit(1);
    
    if (allLeaders.length > 0) {
      console.log("\n🔍 Verificação da hierarquia:");
      const jacyrData = allLeaders[0];
      console.log(`   Jacyr (ID: ${jacyrData.id}, Manager: ${jacyrData.managerId || "Nenhum"})`);
      
      const mazucaData = await db.select().from(employees).where(eq(employees.managerId, jacyrData.id));
      for (const m of mazucaData) {
        console.log(`   └── ${m.name} (ID: ${m.id}, Manager: ${m.managerId})`);
        
        const rodrigoData = await db.select().from(employees).where(eq(employees.managerId, m.id));
        for (const r of rodrigoData) {
          console.log(`       └── ${r.name} (ID: ${r.id}, Manager: ${r.managerId})`);
          
          const mariaData = await db.select().from(employees).where(eq(employees.managerId, r.id));
          for (const mg of mariaData) {
            console.log(`           └── ${mg.name} (ID: ${mg.id}, Manager: ${mg.managerId})`);
          }
        }
      }
    }

  } catch (error) {
    console.error("❌ Erro ao atualizar hierarquia:", error);
    throw error;
  }
}

updateOrgHierarchy()
  .then(() => {
    console.log("\n✅ Script concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro ao executar script:", error);
    process.exit(1);
  });
