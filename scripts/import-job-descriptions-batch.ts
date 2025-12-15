/**
 * Script de Importação em Lote de Descrições de Cargos
 * Importa todas as 481 descrições do arquivo uisa-job-descriptions.json
 */

import { drizzle } from "drizzle-orm/mysql2";
import { jobDescriptions, positions, departments } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface JobDescriptionData {
  filename: string;
  title: string;
  department: string;
  level: string;
  responsibilities: string[];
  requirements: string[];
  competencies: string[];
  rawText: string;
}

async function importJobDescriptions() {
  console.log("🚀 Iniciando importação de descrições de cargos...");

  // Conectar ao banco
  const db = drizzle(process.env.DATABASE_URL!);

  // Ler arquivo JSON
  const filePath = path.join(__dirname, "..", "data", "uisa-job-descriptions.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const descriptionsData: JobDescriptionData[] = JSON.parse(fileContent);

  console.log(`📊 Total de descrições no arquivo: ${descriptionsData.length}`);

  // Verificar quantas já existem no banco
  const existingDescriptions = await db.select().from(jobDescriptions);
  console.log(`📊 Descrições já no banco: ${existingDescriptions.length}`);

  // Buscar todos os cargos e departamentos para vinculação
  const allPositions = await db.select().from(positions);
  const allDepartments = await db.select().from(departments);

  console.log(`📊 Cargos disponíveis: ${allPositions.length}`);
  console.log(`📊 Departamentos disponíveis: ${allDepartments.length}`);

  // Criar mapas para busca rápida (filtrar valores undefined)
  const positionMap = new Map(
    allPositions
      .filter(p => p.name)
      .map(p => [p.name.toLowerCase().trim(), p])
  );
  const departmentMap = new Map(
    allDepartments
      .filter(d => d.name)
      .map(d => [d.name.toLowerCase().trim(), d])
  );

  let imported = 0;
  let errors = 0;
  let skipped = 0;

  for (const desc of descriptionsData) {
    try {
      // Buscar cargo correspondente
      const positionKey = desc.title.toLowerCase().trim();
      let position = positionMap.get(positionKey);

      // Se não encontrar o cargo, pular (não criar automaticamente)
      if (!position) {
        console.log(`⏭️  Cargo não encontrado, pulando: ${desc.title}`);
        skipped++;
        continue;
      }

      // Verificar se já existe descrição para este cargo
      const existing = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.positionId, position.id))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        console.log(`⏭️  Descrição já existe para: ${desc.title}`);
        continue;
      }

      // Extrair objetivo principal do rawText
      let mainObjective = "Objetivo não especificado";
      const objectiveMatch = desc.rawText.match(/Objetivo Principal do Cargo\s*\n\s*([^\n]+(?:\n(?!\n\n)[^\n]+)*)/i);
      if (objectiveMatch) {
        mainObjective = objectiveMatch[1].trim();
      }

      // Inserir descrição de cargo
      await db.insert(jobDescriptions).values({
        positionId: position.id,
        positionTitle: desc.title,
        departmentId: position.departmentId,
        departmentName: desc.department,
        mainObjective: mainObjective,
        mandatoryTraining: desc.requirements.filter(r => r && r.length > 0),
        educationLevel: desc.level,
        requiredExperience: desc.level,
        status: "approved", // Importadas como aprovadas
        createdById: 1, // Admin
      });

      imported++;
      console.log(`✅ Importada: ${desc.title}`);
    } catch (error) {
      errors++;
      console.error(`❌ Erro ao importar ${desc.title}:`, error);
    }
  }

  console.log("\n📊 RESUMO DA IMPORTAÇÃO:");
  console.log(`✅ Importadas com sucesso: ${imported}`);
  console.log(`⏭️  Já existentes (ignoradas): ${skipped}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📊 Total no banco após importação: ${existingDescriptions.length + imported}`);
}

// Executar importação
importJobDescriptions()
  .then(() => {
    console.log("\n✅ Importação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal na importação:", error);
    process.exit(1);
  });
