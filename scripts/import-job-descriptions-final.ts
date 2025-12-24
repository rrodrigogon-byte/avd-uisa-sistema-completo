/**
 * Script Final de Importação de Descrições de Cargos
 * Cria cargos faltantes e suas descrições com encoding corrigido
 */

import { drizzle } from "drizzle-orm/mysql2";
import { jobDescriptions, positions, departments } from "../drizzle/schema";
import { eq, or, like } from "drizzle-orm";
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

/**
 * Corrige encoding de caracteres especiais
 */
function fixEncoding(str: string): string {
  // Mapeamento de caracteres corrompidos para corretos
  const encodingMap: Record<string, string> = {
    '├з': 'ç',
    '├г': 'ã',
    '├│': 'ó',
    '├й': 'é',
    '├к': 'ê',
    '├н': 'í',
    '├║': 'ú',
    '├в': 'Â',
    '├З': 'Ç',
    '├Г': 'Ã',
    '├Й': 'É',
    '├Н': 'Í',
    '├║': 'ú',
    '├╡': 'õ',
    '├б': 'á',
    '├к': 'ê',
  };
  
  let fixed = str;
  for (const [corrupt, correct] of Object.entries(encodingMap)) {
    fixed = fixed.replace(new RegExp(corrupt, 'g'), correct);
  }
  
  return fixed;
}

async function importJobDescriptions() {
  console.log("🚀 Iniciando importação final de descrições de cargos...");

  // Conectar ao banco
  const db = drizzle(process.env.DATABASE_URL!);

  // Ler arquivo JSON
  const filePath = path.join(__dirname, "..", "data", "uisa-job-descriptions.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const descriptionsData: JobDescriptionData[] = JSON.parse(fileContent);

  console.log(`📊 Total de descrições no arquivo: ${descriptionsData.length}`);

  // Buscar departamento padrão para novos cargos
  const allDepartments = await db.select().from(departments);
  const defaultDepartment = allDepartments.find(d => d.name.includes("Administrativo")) || allDepartments[0];
  
  if (!defaultDepartment) {
    console.error("❌ Nenhum departamento encontrado no banco!");
    return;
  }

  console.log(`📊 Usando departamento padrão: ${defaultDepartment.name} (ID: ${defaultDepartment.id})`);

  let imported = 0;
  let errors = 0;
  let skipped = 0;
  let created = 0;

  for (const desc of descriptionsData) {
    try {
      // Corrigir encoding do título
      const fixedTitle = fixEncoding(desc.title);
      
      // Buscar ou criar cargo
      let position = await db
        .select()
        .from(positions)
        .where(eq(positions.title, fixedTitle))
        .limit(1);

      if (position.length === 0) {
        // Criar novo cargo
        console.log(`➥ Criando novo cargo: ${fixedTitle}`);
        const positionCode = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const [newPosition] = await db.insert(positions).values({
          code: positionCode,
          title: fixedTitle,
          departmentId: defaultDepartment.id,
          active: true,
        });
        
        position = [{
          id: Number(newPosition.insertId),
          code: positionCode,
          title: fixedTitle,
          description: null,
          level: null,
          departmentId: defaultDepartment.id,
          salaryMin: null,
          salaryMax: null,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }];
        
        created++;
      }

      const positionData = position[0];

      // Verificar se já existe descrição para este cargo
      const existing = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.positionId, positionData.id))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        console.log(`⏭️  Descrição já existe para: ${fixedTitle}`);
        continue;
      }

      // Extrair objetivo principal do rawText
      let mainObjective = "Responsável pelas atividades relacionadas ao cargo conforme definido pela gestão.";
      const objectiveMatch = desc.rawText.match(/Objetivo Principal do Cargo\s*\n\s*([^\n]+(?:\n(?!\n\n)[^\n]+)*)/i);
      if (objectiveMatch) {
        mainObjective = fixEncoding(objectiveMatch[1].trim());
      }

      // Filtrar e corrigir requirements
      const cleanRequirements = desc.requirements
        .filter(r => r && r.length > 3 && r.length < 500)
        .map(r => fixEncoding(r))
        .slice(0, 20); // Limitar a 20 itens

      // Inserir descrição de cargo
      await db.insert(jobDescriptions).values({
        positionId: positionData.id,
        positionTitle: fixedTitle,
        departmentId: positionData.departmentId,
        departmentName: defaultDepartment.name,
        mainObjective: mainObjective,
        mandatoryTraining: cleanRequirements,
        educationLevel: fixEncoding(desc.level),
        requiredExperience: fixEncoding(desc.level),
        status: "approved",
        createdById: 1,
      });

      imported++;
      console.log(`✅ Importada: ${fixedTitle}`);
    } catch (error: any) {
      errors++;
      console.error(`❌ Erro ao importar ${desc.title}:`, error?.message || error);
    }
  }

  console.log("\n📊 RESUMO DA IMPORTAÇÃO:");
  console.log(`➕ Novos cargos criados: ${created}`);
  console.log(`✅ Descrições importadas: ${imported}`);
  console.log(`⏭️  Já existentes (ignoradas): ${skipped}`);
  console.log(`❌ Erros: ${errors}`);
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
