/**
 * Helpers de Banco de Dados para Testes Geriátricos
 */

import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  geriatricPatients,
  katzTests,
  lawtonTests,
  miniMentalTests,
  gdsTests,
  clockTests,
  type InsertGeriatricPatient,
  type InsertKatzTest,
  type InsertLawtonTest,
  type InsertMiniMentalTest,
  type InsertGDSTest,
  type InsertClockTest,
} from "../drizzle/schema";

// ============================================================================
// PACIENTES
// ============================================================================

export async function createPatient(data: InsertGeriatricPatient) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const result = await db.insert(geriatricPatients).values(data);
  return result[0].insertId;
}

export async function getPatientById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(geriatricPatients)
    .where(eq(geriatricPatients.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getAllPatients(activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(geriatricPatients);

  if (activeOnly) {
    query = query.where(eq(geriatricPatients.ativo, true)) as any;
  }

  return await query.orderBy(desc(geriatricPatients.createdAt));
}

export async function updatePatient(id: number, data: Partial<InsertGeriatricPatient>) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  await db
    .update(geriatricPatients)
    .set(data)
    .where(eq(geriatricPatients.id, id));
}

export async function deletePatient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  // Soft delete
  await db
    .update(geriatricPatients)
    .set({ ativo: false })
    .where(eq(geriatricPatients.id, id));
}

// ============================================================================
// TESTE DE KATZ
// ============================================================================

export async function createKatzTest(data: InsertKatzTest) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const result = await db.insert(katzTests).values(data);
  return result[0].insertId;
}

export async function getKatzTestsByPatient(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(katzTests)
    .where(eq(katzTests.pacienteId, pacienteId))
    .orderBy(desc(katzTests.dataAvaliacao));
}

export async function getKatzTestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(katzTests)
    .where(eq(katzTests.id, id))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// TESTE DE LAWTON
// ============================================================================

export async function createLawtonTest(data: InsertLawtonTest) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const result = await db.insert(lawtonTests).values(data);
  return result[0].insertId;
}

export async function getLawtonTestsByPatient(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(lawtonTests)
    .where(eq(lawtonTests.pacienteId, pacienteId))
    .orderBy(desc(lawtonTests.dataAvaliacao));
}

export async function getLawtonTestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(lawtonTests)
    .where(eq(lawtonTests.id, id))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// MINIMENTAL
// ============================================================================

export async function createMiniMentalTest(data: InsertMiniMentalTest) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const result = await db.insert(miniMentalTests).values(data);
  return result[0].insertId;
}

export async function getMiniMentalTestsByPatient(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(miniMentalTests)
    .where(eq(miniMentalTests.pacienteId, pacienteId))
    .orderBy(desc(miniMentalTests.dataAvaliacao));
}

export async function getMiniMentalTestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(miniMentalTests)
    .where(eq(miniMentalTests.id, id))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// ESCALA DE DEPRESSÃO GERIÁTRICA (GDS)
// ============================================================================

export async function createGDSTest(data: InsertGDSTest) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const result = await db.insert(gdsTests).values(data);
  return result[0].insertId;
}

export async function getGDSTestsByPatient(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gdsTests)
    .where(eq(gdsTests.pacienteId, pacienteId))
    .orderBy(desc(gdsTests.dataAvaliacao));
}

export async function getGDSTestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(gdsTests)
    .where(eq(gdsTests.id, id))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// TESTE DO RELÓGIO
// ============================================================================

export async function createClockTest(data: InsertClockTest) {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const result = await db.insert(clockTests).values(data);
  return result[0].insertId;
}

export async function getClockTestsByPatient(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(clockTests)
    .where(eq(clockTests.pacienteId, pacienteId))
    .orderBy(desc(clockTests.dataAvaliacao));
}

export async function getClockTestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(clockTests)
    .where(eq(clockTests.id, id))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// HISTÓRICO COMPLETO DO PACIENTE
// ============================================================================

export async function getPatientFullHistory(pacienteId: number) {
  const db = await getDb();
  if (!db) return null;

  const patient = await getPatientById(pacienteId);
  if (!patient) return null;

  const [katz, lawton, miniMental, gds, clock] = await Promise.all([
    getKatzTestsByPatient(pacienteId),
    getLawtonTestsByPatient(pacienteId),
    getMiniMentalTestsByPatient(pacienteId),
    getGDSTestsByPatient(pacienteId),
    getClockTestsByPatient(pacienteId),
  ]);

  return {
    patient,
    tests: {
      katz,
      lawton,
      miniMental,
      gds,
      clock,
    },
  };
}

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

/**
 * Calcula a classificação do Teste de Katz
 */
export function calculateKatzClassification(pontuacao: number): "independente" | "dependencia_parcial" | "dependencia_total" {
  if (pontuacao === 6) return "independente";
  if (pontuacao >= 3) return "dependencia_parcial";
  return "dependencia_total";
}

/**
 * Calcula a classificação do Teste de Lawton
 */
export function calculateLawtonClassification(pontuacao: number): "independente" | "dependencia_parcial" | "dependencia_total" {
  if (pontuacao === 8) return "independente";
  if (pontuacao >= 4) return "dependencia_parcial";
  return "dependencia_total";
}

/**
 * Calcula a classificação do Minimental ajustada por escolaridade
 */
export function calculateMiniMentalClassification(
  pontuacao: number,
  escolaridade: string
): "normal" | "comprometimento_leve" | "comprometimento_moderado" | "comprometimento_grave" {
  // Pontos de corte ajustados por escolaridade
  let pontoCorteLeve = 24;
  let pontoCorteGrave = 18;

  if (escolaridade === "analfabeto" || escolaridade === "fundamental_incompleto") {
    pontoCorteLeve = 20;
    pontoCorteGrave = 13;
  } else if (escolaridade === "fundamental_completo" || escolaridade === "medio_incompleto") {
    pontoCorteLeve = 22;
    pontoCorteGrave = 15;
  }

  if (pontuacao >= pontoCorteLeve) return "normal";
  if (pontuacao >= pontoCorteGrave) return "comprometimento_leve";
  if (pontuacao >= 10) return "comprometimento_moderado";
  return "comprometimento_grave";
}

/**
 * Calcula a classificação da Escala de Depressão Geriátrica
 */
export function calculateGDSClassification(pontuacao: number): "normal" | "depressao_leve" | "depressao_grave" {
  if (pontuacao <= 5) return "normal";
  if (pontuacao <= 10) return "depressao_leve";
  return "depressao_grave";
}

/**
 * Calcula a classificação do Teste do Relógio
 */
export function calculateClockClassification(pontuacao: number): "normal" | "comprometimento_leve" | "comprometimento_moderado" | "comprometimento_grave" {
  if (pontuacao >= 9) return "normal";
  if (pontuacao >= 7) return "comprometimento_leve";
  if (pontuacao >= 4) return "comprometimento_moderado";
  return "comprometimento_grave";
}
