/**
 * Script de Importação de Hierarquia Organizacional
 * Importa dados da planilha TOTVS para o banco de dados
 */

import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  employeeHierarchy,
  organizationalSections,
  organizationalPositions,
  hierarchyImportLogs,
  employees,
} from "../../drizzle/schema";

// Tipos para os dados da planilha
interface HierarchyRow {
  Empresa: string;
  Chapa: string;
  Nome: string;
  Email: string | null;
  "[Código Seção]": string;
  Seção: string;
  "[Código Função]": string;
  Função: string;
  "[Chapa Presidente]": string | null;
  Presidente: string | null;
  "[Função Presidente]": string | null;
  "[Email Presidente]": string | null;
  "[Chapa Diretor]": string | null;
  Diretor: string | null;
  "[Função Diretor]": string | null;
  "[Email Diretor]": string | null;
  "[Chapa Gestor]": string | null;
  Gestor: string | null;
  "[Função Gestor]": string | null;
  "[Email Gestor]": string | null;
  "[Chapa Coordenador]": string | number | null;
  Coordenador: string | null;
  "[Função Coordenador]": string | null;
  "[Email Coordenador]": string | null;
}

interface ImportResult {
  success: boolean;
  totalRecords: number;
  importedRecords: number;
  updatedRecords: number;
  errorRecords: number;
  errors: string[];
  sectionsImported: number;
  positionsImported: number;
}

/**
 * Normaliza o valor da chapa (pode vir como número ou string)
 */
function normalizeChapa(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  // Remove .0 de números float e converte para string
  const strValue = String(value).replace(/\.0$/, "");
  // Garante que tenha pelo menos 7 dígitos (padding com zeros à esquerda)
  return strValue.padStart(7, "0");
}

/**
 * Importa seções únicas da planilha
 */
async function importSections(rows: HierarchyRow[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Extrai seções únicas
  const sectionsMap = new Map<string, { code: string; name: string; company: string }>();
  
  for (const row of rows) {
    const code = row["[Código Seção]"];
    if (code && !sectionsMap.has(code)) {
      sectionsMap.set(code, {
        code,
        name: row["Seção"],
        company: row["Empresa"],
      });
    }
  }

  let imported = 0;
  for (const section of sectionsMap.values()) {
    try {
      await db.insert(organizationalSections)
        .values({
          code: section.code,
          name: section.name,
          company: section.company,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: section.name,
            company: section.company,
          },
        });
      imported++;
    } catch (error) {
      console.error(`Erro ao importar seção ${section.code}:`, error);
    }
  }

  return imported;
}

/**
 * Importa funções/cargos únicos da planilha
 */
async function importPositions(rows: HierarchyRow[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Extrai funções únicas
  const positionsMap = new Map<string, { code: string; title: string }>();
  
  for (const row of rows) {
    const code = row["[Código Função]"];
    if (code && !positionsMap.has(code)) {
      positionsMap.set(code, {
        code,
        title: row["Função"],
      });
    }
  }

  let imported = 0;
  for (const position of positionsMap.values()) {
    try {
      await db.insert(organizationalPositions)
        .values({
          code: position.code,
          title: position.title,
        })
        .onDuplicateKeyUpdate({
          set: {
            title: position.title,
          },
        });
      imported++;
    } catch (error) {
      console.error(`Erro ao importar função ${position.code}:`, error);
    }
  }

  return imported;
}

/**
 * Determina o nível hierárquico do funcionário
 */
function determineHierarchyLevel(row: HierarchyRow): "presidente" | "diretor" | "gestor" | "coordenador" | "colaborador" {
  const chapa = normalizeChapa(row.Chapa);
  const presidentChapa = normalizeChapa(row["[Chapa Presidente]"]);
  const directorChapa = normalizeChapa(row["[Chapa Diretor]"]);
  const managerChapa = normalizeChapa(row["[Chapa Gestor]"]);
  const coordinatorChapa = normalizeChapa(row["[Chapa Coordenador]"]);

  // Se a chapa do funcionário é igual à chapa do presidente, é presidente
  if (chapa && presidentChapa && chapa === presidentChapa) return "presidente";
  // Se a chapa do funcionário é igual à chapa do diretor, é diretor
  if (chapa && directorChapa && chapa === directorChapa) return "diretor";
  // Se a chapa do funcionário é igual à chapa do gestor, é gestor
  if (chapa && managerChapa && chapa === managerChapa) return "gestor";
  // Se a chapa do funcionário é igual à chapa do coordenador, é coordenador
  if (chapa && coordinatorChapa && chapa === coordinatorChapa) return "coordenador";
  
  return "colaborador";
}

/**
 * Importa a hierarquia de funcionários
 */
export async function importHierarchyData(
  rows: HierarchyRow[],
  userId?: number,
  userName?: string,
  fileName?: string
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: ImportResult = {
    success: false,
    totalRecords: rows.length,
    importedRecords: 0,
    updatedRecords: 0,
    errorRecords: 0,
    errors: [],
    sectionsImported: 0,
    positionsImported: 0,
  };

  // Criar log de importação
  const [logResult] = await db.insert(hierarchyImportLogs).values({
    fileName: fileName || "hierarchy_import.xlsx",
    totalRecords: rows.length,
    importedRecords: 0,
    updatedRecords: 0,
    errorRecords: 0,
    importedBy: userId,
    importedByName: userName,
    status: "em_andamento",
  });
  const logId = logResult.insertId;

  try {
    // 1. Importar seções
    console.log("Importando seções...");
    result.sectionsImported = await importSections(rows);
    console.log(`${result.sectionsImported} seções importadas`);

    // 2. Importar funções
    console.log("Importando funções...");
    result.positionsImported = await importPositions(rows);
    console.log(`${result.positionsImported} funções importadas`);

    // 3. Identificar quem é líder (aparece como coordenador, gestor, diretor ou presidente de alguém)
    const leaderChapas = new Set<string>();
    for (const row of rows) {
      const coordChapa = normalizeChapa(row["[Chapa Coordenador]"]);
      const managerChapa = normalizeChapa(row["[Chapa Gestor]"]);
      const directorChapa = normalizeChapa(row["[Chapa Diretor]"]);
      const presidentChapa = normalizeChapa(row["[Chapa Presidente]"]);
      
      if (coordChapa) leaderChapas.add(coordChapa);
      if (managerChapa) leaderChapas.add(managerChapa);
      if (directorChapa) leaderChapas.add(directorChapa);
      if (presidentChapa) leaderChapas.add(presidentChapa);
    }
    console.log(`${leaderChapas.size} líderes identificados`);

    // 4. Importar hierarquia de funcionários
    console.log("Importando hierarquia de funcionários...");
    
    // Agrupar por chapa para evitar duplicatas
    const uniqueRows = new Map<string, HierarchyRow>();
    for (const row of rows) {
      const chapa = normalizeChapa(row.Chapa);
      if (chapa && !uniqueRows.has(chapa)) {
        uniqueRows.set(chapa, row);
      }
    }
    console.log(`${uniqueRows.size} funcionários únicos para importar`);

    for (const [chapa, row] of uniqueRows) {
      try {
        const hierarchyLevel = determineHierarchyLevel(row);
        const isLeader = leaderChapas.has(chapa);

        // Verificar se já existe
        const existing = await db
          .select({ id: employeeHierarchy.id })
          .from(employeeHierarchy)
          .where(eq(employeeHierarchy.employeeChapa, chapa))
          .limit(1);

        // Buscar employeeId se existir na tabela employees
        const employeeRecord = await db
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.chapa, chapa))
          .limit(1);
        
        const employeeId = employeeRecord.length > 0 ? employeeRecord[0].id : null;

        const hierarchyData = {
          employeeId: employeeId || 0,
          employeeChapa: chapa,
          employeeName: row.Nome,
          employeeEmail: row.Email || null,
          employeeFunction: row["Função"],
          employeeFunctionCode: row["[Código Função]"],
          employeeSection: row["Seção"],
          employeeSectionCode: row["[Código Seção]"],
          coordinatorChapa: normalizeChapa(row["[Chapa Coordenador]"]),
          coordinatorName: row.Coordenador || null,
          coordinatorFunction: row["[Função Coordenador]"] || null,
          coordinatorEmail: row["[Email Coordenador]"] || null,
          managerChapa: normalizeChapa(row["[Chapa Gestor]"]),
          managerName: row.Gestor || null,
          managerFunction: row["[Função Gestor]"] || null,
          managerEmail: row["[Email Gestor]"] || null,
          directorChapa: normalizeChapa(row["[Chapa Diretor]"]),
          directorName: row.Diretor || null,
          directorFunction: row["[Função Diretor]"] || null,
          directorEmail: row["[Email Diretor]"] || null,
          presidentChapa: normalizeChapa(row["[Chapa Presidente]"]),
          presidentName: row.Presidente || null,
          presidentFunction: row["[Função Presidente]"] || null,
          presidentEmail: row["[Email Presidente]"] || null,
        };

        if (existing.length > 0) {
          // Atualizar registro existente
          await db
            .update(employeeHierarchy)
            .set(hierarchyData)
            .where(eq(employeeHierarchy.id, existing[0].id));
          result.updatedRecords++;
        } else {
          // Inserir novo registro
          await db.insert(employeeHierarchy).values(hierarchyData);
          result.importedRecords++;
        }
      } catch (error) {
        result.errorRecords++;
        const errorMsg = `Erro ao importar funcionário ${chapa}: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    result.success = true;

    // Atualizar log de importação
    await db
      .update(hierarchyImportLogs)
      .set({
        importedRecords: result.importedRecords,
        updatedRecords: result.updatedRecords,
        errorRecords: result.errorRecords,
        errors: result.errors.length > 0 ? result.errors : null,
        status: "concluido",
        completedAt: new Date(),
      })
      .where(eq(hierarchyImportLogs.id, logId));

  } catch (error) {
    result.success = false;
    const errorMsg = `Erro geral na importação: ${error instanceof Error ? error.message : String(error)}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);

    // Atualizar log de importação com erro
    await db
      .update(hierarchyImportLogs)
      .set({
        importedRecords: result.importedRecords,
        updatedRecords: result.updatedRecords,
        errorRecords: result.errorRecords,
        errors: result.errors,
        status: "erro",
        completedAt: new Date(),
      })
      .where(eq(hierarchyImportLogs.id, logId));
  }

  console.log("Importação concluída:", result);
  return result;
}

/**
 * Busca subordinados de um líder pela chapa
 */
export async function getSubordinatesByLeaderChapa(leaderChapa: string) {
  const db = await getDb();
  if (!db) return [];

  const normalizedChapa = normalizeChapa(leaderChapa);
  if (!normalizedChapa) return [];

  // Buscar subordinados diretos (coordenador)
  const directReports = await db
    .select()
    .from(employeeHierarchy)
    .where(eq(employeeHierarchy.coordinatorChapa, normalizedChapa));

  // Buscar subordinados de gestão
  const managedReports = await db
    .select()
    .from(employeeHierarchy)
    .where(eq(employeeHierarchy.managerChapa, normalizedChapa));

  // Buscar subordinados de diretoria
  const directedReports = await db
    .select()
    .from(employeeHierarchy)
    .where(eq(employeeHierarchy.directorChapa, normalizedChapa));

  return {
    directReports,
    managedReports,
    directedReports,
    total: directReports.length + managedReports.length + directedReports.length,
  };
}

/**
 * Busca a hierarquia completa de um funcionário
 */
export async function getEmployeeHierarchyByChapa(chapa: string) {
  const db = await getDb();
  if (!db) return null;

  const normalizedChapa = normalizeChapa(chapa);
  if (!normalizedChapa) return null;

  const result = await db
    .select()
    .from(employeeHierarchy)
    .where(eq(employeeHierarchy.employeeChapa, normalizedChapa))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
