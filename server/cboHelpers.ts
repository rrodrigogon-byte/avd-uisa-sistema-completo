import { eq, like, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  cboCargos,
  cboSearchHistory,
  type CBOCargo,
  type InsertCBOCargo,
  type InsertCBOSearchHistory,
} from "../drizzle/schema";

// ============================================================================
// INTEGRAÇÃO COM API CBO
// ============================================================================

/**
 * Interface para dados da API CBO
 */
interface CBOApiResponse {
  codigo: string;
  titulo: string;
  descricao?: string;
  formacao?: string;
  experiencia?: string;
  condicoes?: string;
  recursos?: string[];
  atividades?: string[];
  competencias?: string[];
  familia?: string;
  sinonimos?: string[];
}

/**
 * Busca cargos na API CBO
 * Nota: A API CBO real requer integração específica
 * Esta é uma implementação de exemplo que deve ser adaptada
 */
export async function searchCBOApi(searchTerm: string): Promise<CBOApiResponse[]> {
  try {
    // TODO: Implementar integração real com API CBO
    // Por enquanto, retorna array vazio
    // A API oficial está em: https://www.ocupacoes.com.br/
    
    console.log(`[CBO] Buscando por: ${searchTerm}`);
    
    // Exemplo de estrutura de retorno esperada:
    // const response = await fetch(`https://api.cbo.gov.br/search?q=${encodeURIComponent(searchTerm)}`);
    // const data = await response.json();
    // return data.resultados;
    
    return [];
  } catch (error) {
    console.error("[CBO] Erro ao buscar na API:", error);
    return [];
  }
}

/**
 * Importa cargo da API CBO para o cache local
 */
export async function importCBOCargo(codigoCBO: string): Promise<CBOCargo | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Busca na API
    const apiResults = await searchCBOApi(codigoCBO);
    
    if (apiResults.length === 0) {
      return null;
    }

    const apiData = apiResults[0];

    // Prepara dados para inserção
    const cargoData: InsertCBOCargo = {
      codigoCBO: apiData.codigo,
      titulo: apiData.titulo,
      descricaoSumaria: apiData.descricao || null,
      formacao: apiData.formacao || null,
      experiencia: apiData.experiencia || null,
      condicoesExercicio: apiData.condicoes || null,
      recursosTrabalho: apiData.recursos || null,
      atividadesPrincipais: apiData.atividades || null,
      competenciasPessoais: apiData.competencias || null,
      familiaOcupacional: apiData.familia || null,
      sinonimos: apiData.sinonimos || null,
      ultimaAtualizacao: new Date(),
      fonteDados: "API CBO",
      vezesUtilizado: 1,
      ultimoUso: new Date(),
    };

    // Insere ou atualiza no cache
    const result = await db.insert(cboCargos).values(cargoData).onDuplicateKeyUpdate({
      set: {
        titulo: cargoData.titulo,
        descricaoSumaria: cargoData.descricaoSumaria,
        formacao: cargoData.formacao,
        experiencia: cargoData.experiencia,
        condicoesExercicio: cargoData.condicoesExercicio,
        recursosTrabalho: cargoData.recursosTrabalho,
        atividadesPrincipais: cargoData.atividadesPrincipais,
        competenciasPessoais: cargoData.competenciasPessoais,
        familiaOcupacional: cargoData.familiaOcupacional,
        sinonimos: cargoData.sinonimos,
        ultimaAtualizacao: new Date(),
        vezesUtilizado: sql`vezesUtilizado + 1`,
        ultimoUso: new Date(),
      },
    });

    // Busca o cargo inserido/atualizado
    const cargo = await db
      .select()
      .from(cboCargos)
      .where(eq(cboCargos.codigoCBO, codigoCBO))
      .limit(1);

    return cargo[0] || null;
  } catch (error) {
    console.error("[CBO] Erro ao importar cargo:", error);
    throw error;
  }
}

/**
 * Busca cargos no cache local
 */
export async function searchCBOLocal(searchTerm: string, limit: number = 20): Promise<CBOCargo[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const results = await db
      .select()
      .from(cboCargos)
      .where(
        sql`${cboCargos.titulo} LIKE ${`%${searchTerm}%`} OR ${cboCargos.codigoCBO} LIKE ${`%${searchTerm}%`}`
      )
      .orderBy(desc(cboCargos.vezesUtilizado), desc(cboCargos.ultimoUso))
      .limit(limit);

    return results;
  } catch (error) {
    console.error("[CBO] Erro ao buscar no cache local:", error);
    return [];
  }
}

/**
 * Busca cargo por código CBO
 */
export async function getCBOByCodigo(codigoCBO: string): Promise<CBOCargo | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .select()
      .from(cboCargos)
      .where(eq(cboCargos.codigoCBO, codigoCBO))
      .limit(1);

    if (result.length > 0) {
      // Atualiza contadores de uso
      await db
        .update(cboCargos)
        .set({
          vezesUtilizado: sql`vezesUtilizado + 1`,
          ultimoUso: new Date(),
        })
        .where(eq(cboCargos.codigoCBO, codigoCBO));

      return result[0];
    }

    // Se não encontrou no cache, tenta importar da API
    return await importCBOCargo(codigoCBO);
  } catch (error) {
    console.error("[CBO] Erro ao buscar cargo por código:", error);
    return null;
  }
}

/**
 * Registra busca no histórico
 */
export async function logCBOSearch(
  userId: number,
  searchTerm: string,
  codigoCBOSelecionado: string | null,
  resultadosEncontrados: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  try {
    const searchData: InsertCBOSearchHistory = {
      userId,
      searchTerm,
      codigoCBOSelecionado,
      resultadosEncontrados,
    };

    await db.insert(cboSearchHistory).values(searchData);
  } catch (error) {
    console.error("[CBO] Erro ao registrar busca:", error);
  }
}

/**
 * Obtém sugestões de cargos baseadas no histórico do usuário
 */
export async function getCBOSuggestions(userId: number, limit: number = 10): Promise<CBOCargo[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    // Busca os códigos CBO mais selecionados pelo usuário
    const userHistory = await db
      .select({
        codigoCBO: cboSearchHistory.codigoCBOSelecionado,
        count: sql<number>`COUNT(*)`,
      })
      .from(cboSearchHistory)
      .where(eq(cboSearchHistory.userId, userId))
      .groupBy(cboSearchHistory.codigoCBOSelecionado)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    if (userHistory.length === 0) {
      // Se não há histórico, retorna os mais utilizados globalmente
      return await db
        .select()
        .from(cboCargos)
        .orderBy(desc(cboCargos.vezesUtilizado))
        .limit(limit);
    }

    // Busca os cargos correspondentes
    const codigosCBO = userHistory
      .map((h) => h.codigoCBO)
      .filter((c): c is string => c !== null);

    if (codigosCBO.length === 0) {
      return [];
    }

    const cargos = await db
      .select()
      .from(cboCargos)
      .where(sql`${cboCargos.codigoCBO} IN (${sql.join(codigosCBO.map((c) => sql`${c}`), sql`, `)})`);

    return cargos;
  } catch (error) {
    console.error("[CBO] Erro ao obter sugestões:", error);
    return [];
  }
}

/**
 * Obtém cargos mais utilizados (cache "quente")
 */
export async function getTopCBOCargos(limit: number = 50): Promise<CBOCargo[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    return await db
      .select()
      .from(cboCargos)
      .orderBy(desc(cboCargos.vezesUtilizado), desc(cboCargos.ultimoUso))
      .limit(limit);
  } catch (error) {
    console.error("[CBO] Erro ao obter top cargos:", error);
    return [];
  }
}

/**
 * Atualiza cache de cargo CBO
 */
export async function updateCBOCache(codigoCBO: string): Promise<CBOCargo | null> {
  return await importCBOCargo(codigoCBO);
}
