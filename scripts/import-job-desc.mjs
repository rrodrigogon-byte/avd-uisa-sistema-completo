/**
 * Script de Importação de Descrições de Cargos UISA
 * Importa 481 descrições de cargos do arquivo JSON para o banco de dados
 */

import { getDb } from "../server/db.js";
import {
  jobDescriptions,
  jobResponsibilities,
  jobKnowledge,
  jobCompetencies,
  positions,
  departments,
} from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importJobDescriptions() {
  console.log("🚀 Iniciando importação de descrições de cargos...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Banco de dados não disponível");
    process.exit(1);
  }

  // Carregar dados do JSON
  const dataPath = path.join(__dirname, "../data/uisa-job-descriptions.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const jobDescriptionsData = JSON.parse(rawData);

  console.log(`📊 Total de descrições a importar: ${jobDescriptionsData.length}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < Math.min(10, jobDescriptionsData.length); i++) {
    const jobData = jobDescriptionsData[i];
    
    try {
      console.log(`[${i + 1}/${jobDescriptionsData.length}] Processando: ${jobData.title}`);

      // Extrair informações do título
      const titleMatch = jobData.title.match(/\((\d+)\)\s+(.+)/);
      const positionCode = titleMatch ? titleMatch[1] : String(i + 1);
      const positionTitle = titleMatch ? titleMatch[2].trim() : jobData.title;

      // Buscar ou criar departamento
      let departmentId = 1; // Default
      if (jobData.department && jobData.department.trim()) {
        const existingDept = await db
          .select()
          .from(departments)
          .where(eq(departments.name, jobData.department.trim()))
          .limit(1);

        if (existingDept && existingDept.length > 0) {
          departmentId = existingDept[0].id;
        } else {
          // Criar departamento se não existir
          const newDept = await db
            .insert(departments)
            .values({
              code: `DEPT-${positionCode}`,
              name: jobData.department.trim(),
              description: `Departamento: ${jobData.department.trim()}`,
              active: true,
            })
            .$returningId();
          departmentId = newDept[0].id;
        }
      }

      // Buscar ou criar cargo (position)
      let positionId;
      const existingPosition = await db
        .select()
        .from(positions)
        .where(eq(positions.title, positionTitle))
        .limit(1);

      if (existingPosition && existingPosition.length > 0) {
        positionId = existingPosition[0].id;
        console.log(`  ✓ Cargo já existe: ${positionTitle}`);
      } else {
        const newPosition = await db
          .insert(positions)
          .values({
            code: `POS-${positionCode}`,
            title: positionTitle,
            description: `Cargo: ${positionTitle}`,
            departmentId: departmentId,
            active: true,
          })
          .$returningId();
        positionId = newPosition[0].id;
        console.log(`  ✓ Cargo criado: ${positionTitle}`);
      }

      // Verificar se já existe descrição para este cargo
      const existingDesc = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.positionId, positionId))
        .limit(1);

      if (existingDesc && existingDesc.length > 0) {
        console.log(`  ⊘ Descrição já existe para este cargo, pulando...`);
        skipped++;
        continue;
      }

      // Extrair objetivo principal do rawText
      const objectiveMatch = jobData.rawText.match(
        /Objetivo Principal do Cargo\s+([\s\S]+?)(?=\n\n\n|Responsabilidades)/
      );
      const mainObjective = objectiveMatch
        ? objectiveMatch[1].trim()
        : "Objetivo não especificado";

      // Extrair CBO
      const cboMatch = jobData.rawText.match(/CBO:\s*(\d+)/);
      const cbo = cboMatch ? cboMatch[1] : "";

      // Extrair formação
      const educationMatch = jobData.rawText.match(/Formação\s+([\s\S]+?)(?=\n|Experiência)/);
      const educationLevel = educationMatch ? educationMatch[1].trim() : "";

      // Extrair experiência
      const experienceMatch = jobData.rawText.match(/Experiência\s+([\s\S]+?)(?=\n|e-Social)/);
      const requiredExperience = experienceMatch ? experienceMatch[1].trim() : "";

      // Criar descrição de cargo
      const newJobDesc = await db
        .insert(jobDescriptions)
        .values({
          positionId: positionId,
          positionTitle: positionTitle,
          departmentId: departmentId,
          departmentName: jobData.department || "",
          cbo: cbo,
          division: "",
          reportsTo: "",
          revision: "1.0",
          mainObjective: mainObjective,
          mandatoryTraining: JSON.stringify([]),
          educationLevel: educationLevel,
          requiredExperience: requiredExperience,
          eSocialSpecs: "",
          status: "draft",
          createdBy: 1,
        })
        .$returningId();

      const jobDescId = newJobDesc[0].id;

      // Processar responsabilidades
      if (jobData.responsibilities && jobData.responsibilities.length > 0) {
        let currentCategory = "Geral";
        let displayOrder = 0;

        for (const resp of jobData.responsibilities) {
          // Detectar se é uma categoria
          const categories = [
            "Processo",
            "Análise KPI",
            "Planejamento",
            "Budget,Capex, Forecast",
            "Resultados",
          ];
          if (categories.includes(resp)) {
            currentCategory = resp;
            continue;
          }

          // Ignorar linhas vazias ou muito curtas
          if (!resp || resp.trim().length < 10) continue;

          await db.insert(jobResponsibilities).values({
            jobDescriptionId: jobDescId,
            category: currentCategory,
            description: resp.trim(),
            displayOrder: displayOrder++,
          });
        }
      }

      imported++;
      console.log(`  ✅ Importado com sucesso!\n`);
    } catch (error) {
      errors++;
      console.error(`  ❌ Erro ao importar: ${error.message}\n`);
      console.error(error.stack);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DA IMPORTAÇÃO (TESTE - 10 PRIMEIROS)");
  console.log("=".repeat(60));
  console.log(`✅ Importados: ${imported}`);
  console.log(`⊘ Pulados (já existentes): ${skipped}`);
  console.log(`❌ Erros: ${errors}`);
  console.log("=".repeat(60));
}

// Executar importação
importJobDescriptions()
  .then(() => {
    console.log("\n✅ Importação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    console.error(error.stack);
    process.exit(1);
  });
