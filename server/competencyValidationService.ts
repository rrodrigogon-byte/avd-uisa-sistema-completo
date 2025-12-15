import { getDb } from "./db";
import { competencies } from "../drizzle/schema";
import { like, or } from "drizzle-orm";

/**
 * Serviço de validação avançada de competências
 * Implementa busca fuzzy e sugestões de competências similares
 */

interface CompetencySuggestion {
  id: number;
  name: string;
  description: string | null;
  similarity: number; // 0-1, onde 1 é correspondência exata
  matchType: 'exact' | 'partial' | 'fuzzy';
}

/**
 * Calcula similaridade de Levenshtein entre duas strings
 * Retorna valor entre 0 e 1, onde 1 é idêntico
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
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
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

/**
 * Busca competências similares usando busca fuzzy
 */
export async function findSimilarCompetencies(
  competencyName: string,
  threshold: number = 0.6
): Promise<CompetencySuggestion[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Primeiro, buscar correspondência exata
    const exactMatches = await db
      .select()
      .from(competencies)
      .where(like(competencies.name, competencyName))
      .limit(1);

    if (exactMatches.length > 0) {
      return [{
        id: exactMatches[0].id,
        name: exactMatches[0].name,
        description: exactMatches[0].description,
        similarity: 1.0,
        matchType: 'exact',
      }];
    }

    // Buscar correspondências parciais (contém ou está contido)
    const partialMatches = await db
      .select()
      .from(competencies)
      .where(
        or(
          like(competencies.name, `%${competencyName}%`),
          like(competencies.description, `%${competencyName}%`)
        )
      )
      .limit(10);

    const suggestions: CompetencySuggestion[] = partialMatches.map(comp => ({
      id: comp.id,
      name: comp.name,
      description: comp.description,
      similarity: levenshteinSimilarity(competencyName, comp.name),
      matchType: 'partial' as const,
    }));

    // Se não encontrou correspondências parciais, buscar todas e fazer fuzzy matching
    if (suggestions.length === 0) {
      const allCompetencies = await db
        .select()
        .from(competencies)
        .limit(100); // Limitar para performance

      const fuzzyMatches = allCompetencies
        .map(comp => ({
          id: comp.id,
          name: comp.name,
          description: comp.description,
          similarity: levenshteinSimilarity(competencyName, comp.name),
          matchType: 'fuzzy' as const,
        }))
        .filter(match => match.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      suggestions.push(...fuzzyMatches);
    }

    // Ordenar por similaridade
    return suggestions.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error("Erro ao buscar competências similares:", error);
    return [];
  }
}

/**
 * Valida e sugere competências para uma lista de nomes
 */
export async function validateAndSuggestCompetencies(
  competencyNames: string[]
): Promise<Map<string, CompetencySuggestion[]>> {
  const results = new Map<string, CompetencySuggestion[]>();

  for (const name of competencyNames) {
    const suggestions = await findSimilarCompetencies(name);
    results.set(name, suggestions);
  }

  return results;
}

/**
 * Cria uma nova competência se não existir
 */
export async function createCompetencyIfNotExists(
  name: string,
  description?: string,
  category?: string
): Promise<{ id: number; name: string; created: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Verificar se já existe
    const existing = await db
      .select()
      .from(competencies)
      .where(like(competencies.name, name))
      .limit(1);

    if (existing.length > 0) {
      return {
        id: existing[0].id,
        name: existing[0].name,
        created: false,
      };
    }

    // Criar nova competência
    const code = `COMP_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [result] = await db.insert(competencies).values({
      code,
      name,
      description: description || `Competência importada: ${name}`,
      category: category || "Geral",
      isActive: true,
    });

    return {
      id: Number(result.insertId),
      name,
      created: true,
    };
  } catch (error) {
    console.error("Erro ao criar competência:", error);
    throw error;
  }
}

/**
 * Validação interativa de competências durante importação
 */
export interface CompetencyValidationResult {
  original: string;
  suggestions: CompetencySuggestion[];
  action: 'use_existing' | 'create_new' | 'skip';
  selectedId?: number;
  newName?: string;
}

export async function interactiveCompetencyValidation(
  competencyName: string,
  autoCreate: boolean = false
): Promise<CompetencyValidationResult> {
  const suggestions = await findSimilarCompetencies(competencyName);

  // Se encontrou correspondência exata, usar
  if (suggestions.length > 0 && suggestions[0].matchType === 'exact') {
    return {
      original: competencyName,
      suggestions,
      action: 'use_existing',
      selectedId: suggestions[0].id,
    };
  }

  // Se encontrou sugestões com alta similaridade (>= 0.8), sugerir
  const highSimilarity = suggestions.filter(s => s.similarity >= 0.8);
  if (highSimilarity.length > 0) {
    return {
      original: competencyName,
      suggestions: highSimilarity,
      action: 'use_existing',
      selectedId: highSimilarity[0].id,
    };
  }

  // Se autoCreate está habilitado, criar nova
  if (autoCreate) {
    const newComp = await createCompetencyIfNotExists(competencyName);
    return {
      original: competencyName,
      suggestions,
      action: 'create_new',
      selectedId: newComp.id,
      newName: newComp.name,
    };
  }

  // Caso contrário, retornar sugestões para decisão manual
  return {
    original: competencyName,
    suggestions,
    action: 'skip',
  };
}
