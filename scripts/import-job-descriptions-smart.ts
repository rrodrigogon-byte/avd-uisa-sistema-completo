/**
 * Script de Importação Inteligente de Descrições de Cargos
 * Usa algoritmo de similaridade para vincular descrições aos cargos existentes
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

/**
 * Calcula similaridade entre duas strings usando Levenshtein Distance
 * Retorna valor entre 0 (totalmente diferente) e 1 (idêntico)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Matriz de distâncias
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return 1 - (distance / maxLen);
}

/**
 * Normaliza string removendo caracteres especiais e acentos
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();
}

/**
 * Encontra o cargo mais similar
 */
function findBestMatch(
  title: string,
  positions: Array<{ id: number; name: string; departmentId: number }>
): { position: typeof positions[0]; similarity: number } | null {
  const normalizedTitle = normalizeString(title);
  
  let bestMatch: typeof positions[0] | null = null;
  let bestSimilarity = 0;
  
  for (const position of positions) {
    const normalizedPosition = normalizeString(position.name);
    const similarity = calculateSimilarity(normalizedTitle, normalizedPosition);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = position;
    }
  }
  
  // Só aceita matches com similaridade >= 0.6 (60%)
  if (bestMatch && bestSimilarity >= 0.6) {
    return { position: bestMatch, similarity: bestSimilarity };
  }
  
  return null;
}

async function importJobDescriptions() {
  console.log("🚀 Iniciando importação inteligente de descrições de cargos...");

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

  // Buscar todos os cargos
  const allPositions = await db.select().from(positions);
  console.log(`📊 Cargos disponíveis para matching: ${allPositions.length}`);

  // Filtrar cargos válidos
  const validPositions = allPositions.filter(p => p.name && p.name.length > 0);

  let imported = 0;
  let errors = 0;
  let skipped = 0;
  let matched = 0;

  for (const desc of descriptionsData) {
    try {
      // Tentar encontrar cargo similar
      const match = findBestMatch(desc.title, validPositions);
      
      if (!match) {
        console.log(`⏭️  Nenhum cargo similar encontrado para: ${desc.title}`);
        skipped++;
        continue;
      }
      
      const { position, similarity } = match;
      matched++;
      
      console.log(`🎯 Match encontrado (${(similarity * 100).toFixed(1)}%): "${desc.title}" → "${position.name}"`);

      // Verificar se já existe descrição para este cargo
      const existing = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.positionId, position.id))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        console.log(`   ⏭️  Descrição já existe, pulando...`);
        continue;
      }

      // Extrair objetivo principal do rawText
      let mainObjective = "Objetivo não especificado";
      const objectiveMatch = desc.rawText.match(/Objetivo Principal do Cargo\s*\n\s*([^\n]+(?:\n(?!\n\n)[^\n]+)*)/i);
      if (objectiveMatch) {
        mainObjective = objectiveMatch[1].trim();
      }

      // Buscar departamento
      const department = await db
        .select()
        .from(departments)
        .where(eq(departments.id, position.departmentId))
        .limit(1);

      const departmentName = department[0]?.name || "Departamento não especificado";

      // Inserir descrição de cargo
      await db.insert(jobDescriptions).values({
        positionId: position.id,
        positionTitle: position.name,
        departmentId: position.departmentId,
        departmentName: departmentName,
        mainObjective: mainObjective,
        mandatoryTraining: desc.requirements.filter(r => r && r.length > 0 && r.length < 500),
        educationLevel: desc.level,
        requiredExperience: desc.level,
        status: "approved", // Importadas como aprovadas
        createdById: 1, // Admin
      });

      imported++;
      console.log(`   ✅ Importada com sucesso!`);
    } catch (error) {
      errors++;
      console.error(`❌ Erro ao importar ${desc.title}:`, error);
    }
  }

  console.log("\n📊 RESUMO DA IMPORTAÇÃO:");
  console.log(`🎯 Matches encontrados: ${matched}`);
  console.log(`✅ Importadas com sucesso: ${imported}`);
  console.log(`⏭️  Já existentes (ignoradas): ${skipped - (matched - imported)}`);
  console.log(`⏭️  Sem match (puladas): ${descriptionsData.length - matched}`);
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
