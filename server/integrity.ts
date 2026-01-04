/**
 * Sistema AVD UISA - Validações e Integridade de Dados
 * 
 * Este arquivo contém funções de validação, transações e auditoria
 * para garantir a integridade do sistema.
 */

import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  auditLogs,
  type InsertAuditLog,
  employees,
  evaluationCycles,
  performanceEvaluations,
  avdAssessmentProcesses,
} from "../drizzle/schema";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuditContext {
  userId: number;
  userName?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: number;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// VALIDAÇÕES DE DADOS
// ============================================================================

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de CPF
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

/**
 * Valida formato de telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");
  // Aceita telefones com 10 ou 11 dígitos (com ou sem 9 no celular)
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Valida data (não pode ser futura para datas de nascimento/contratação)
 */
export function validatePastDate(date: Date): boolean {
  return date <= new Date();
}

/**
 * Valida range de datas (início deve ser antes do fim)
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate;
}

/**
 * Valida dados de colaborador
 */
export function validateEmployeeData(data: {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  birthDate?: Date;
  hireDate?: Date;
}): ValidationResult {
  const errors: string[] = [];
  
  if (data.name && data.name.trim().length < 3) {
    errors.push("Nome deve ter pelo menos 3 caracteres");
  }
  
  if (data.email && !validateEmail(data.email)) {
    errors.push("Email inválido");
  }
  
  if (data.cpf && !validateCPF(data.cpf)) {
    errors.push("CPF inválido");
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push("Telefone inválido");
  }
  
  if (data.birthDate && !validatePastDate(data.birthDate)) {
    errors.push("Data de nascimento não pode ser futura");
  }
  
  if (data.hireDate && !validatePastDate(data.hireDate)) {
    errors.push("Data de contratação não pode ser futura");
  }
  
  if (data.birthDate && data.hireDate) {
    const age = data.hireDate.getFullYear() - data.birthDate.getFullYear();
    if (age < 14) {
      errors.push("Colaborador deve ter pelo menos 14 anos na data de contratação");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida dados de ciclo de avaliação
 */
export function validateEvaluationCycleData(data: {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}): ValidationResult {
  const errors: string[] = [];
  
  if (data.name && data.name.trim().length < 3) {
    errors.push("Nome do ciclo deve ter pelo menos 3 caracteres");
  }
  
  if (data.startDate && data.endDate) {
    if (!validateDateRange(data.startDate, data.endDate)) {
      errors.push("Data de início deve ser anterior à data de término");
    }
    
    const durationDays = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays < 7) {
      errors.push("Ciclo de avaliação deve ter pelo menos 7 dias");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// VERIFICAÇÕES DE INTEGRIDADE REFERENCIAL
// ============================================================================

/**
 * Verifica se colaborador existe
 */
export async function employeeExists(employeeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Verifica se ciclo de avaliação existe
 */
export async function evaluationCycleExists(cycleId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select({ id: evaluationCycles.id })
    .from(evaluationCycles)
    .where(eq(evaluationCycles.id, cycleId))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Verifica se já existe avaliação para colaborador no ciclo
 */
export async function evaluationExistsForEmployeeInCycle(
  employeeId: number,
  cycleId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select({ id: performanceEvaluations.id })
    .from(performanceEvaluations)
    .where(
      and(
        eq(performanceEvaluations.employeeId, employeeId),
        eq(performanceEvaluations.cycleId, cycleId)
      )
    )
    .limit(1);
  
  return result.length > 0;
}

/**
 * Verifica se processo AVD já existe para colaborador
 */
export async function avdProcessExistsForEmployee(employeeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select({ id: avdAssessmentProcesses.id })
    .from(avdAssessmentProcesses)
    .where(eq(avdAssessmentProcesses.employeeId, employeeId))
    .limit(1);
  
  return result.length > 0;
}

// ============================================================================
// TRANSAÇÕES
// ============================================================================

/**
 * Executa operação em transação com rollback automático em caso de erro
 */
export async function withTransaction<T>(
  operation: (db: any) => Promise<T>
): Promise<TransactionResult<T>> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      error: "Database not available",
    };
  }
  
  try {
    const result = await db.transaction(async (tx) => {
      return await operation(tx);
    });
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[Transaction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// AUDITORIA
// ============================================================================

/**
 * Registra ação de auditoria
 */
export async function logAudit(context: AuditContext, details?: {
  oldValue?: any;
  newValue?: any;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Cannot log: database not available");
    return;
  }
  
  try {
    // Preparar objeto de mudanças
    const changes: any = {};
    if (details?.oldValue !== undefined) {
      changes.oldValue = details.oldValue;
    }
    if (details?.newValue !== undefined) {
      changes.newValue = details.newValue;
    }
    if (details?.success !== undefined) {
      changes.success = details.success;
    }
    if (details?.errorMessage) {
      changes.errorMessage = details.errorMessage;
    }
    
    const auditLog: InsertAuditLog = {
      userId: context.userId,
      action: context.action,
      entity: context.resource, // Campo obrigatório no schema
      entityId: context.resourceId,
      changes: safeObjectKeys(changes).length > 0 ? JSON.stringify(changes) : undefined,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    };
    
    await db.insert(auditLogs).values(auditLog);
  } catch (error) {
    console.error("[Audit] Failed to log:", error);
    // Não lançar erro para não interromper operação principal
  }
}

/**
 * Registra criação de recurso
 */
export async function logCreate(
  context: AuditContext,
  newValue: any
): Promise<void> {
  await logAudit(context, {
    newValue,
    success: true,
  });
}

/**
 * Registra atualização de recurso
 */
export async function logUpdate(
  context: AuditContext,
  oldValue: any,
  newValue: any
): Promise<void> {
  await logAudit(context, {
    oldValue,
    newValue,
    success: true,
  });
}

/**
 * Registra exclusão de recurso
 */
export async function logDelete(
  context: AuditContext,
  oldValue: any
): Promise<void> {
  await logAudit(context, {
    oldValue,
    success: true,
  });
}

/**
 * Registra erro em operação
 */
export async function logError(
  context: AuditContext,
  errorMessage: string
): Promise<void> {
  await logAudit(context, {
    success: false,
    errorMessage,
  });
}

// ============================================================================
// HELPERS DE VALIDAÇÃO PARA PROCEDURES
// ============================================================================

/**
 * Valida e lança erro se dados inválidos
 */
export function assertValid(validation: ValidationResult): void {
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }
}

/**
 * Valida e lança erro se recurso não existe
 */
export async function assertExists(
  resourceName: string,
  checkFn: () => Promise<boolean>
): Promise<void> {
  const exists = await checkFn();
  if (!exists) {
    throw new Error(`${resourceName} not found`);
  }
}

/**
 * Valida e lança erro se recurso já existe
 */
export async function assertNotExists(
  resourceName: string,
  checkFn: () => Promise<boolean>
): Promise<void> {
  const exists = await checkFn();
  if (exists) {
    throw new Error(`${resourceName} already exists`);
  }
}
