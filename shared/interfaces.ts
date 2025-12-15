/**
 * Interfaces TypeScript Auxiliares
 * Sistema AVD UISA - Avaliação de Desempenho
 * 
 * Este arquivo define interfaces auxiliares para resolver erros TS7006
 * Complementa os tipos do schema.ts com estruturas de dados compostas
 */

import type {
  Employee as SchemaEmployee,
  PerformanceEvaluation as SchemaEvaluation,
  SmartGoal as SchemaGoal,
  Department as SchemaDepartment,
  Position as SchemaPosition,
  EvaluationCycle as SchemaEvaluationCycle,
  PdiPlan as SchemaPDIPlan,
  PdiItem as SchemaPDIItem,
  NineBoxPosition as SchemaNineBoxPosition,
  SuccessionPlan as SchemaSuccessionPlan,
} from "../drizzle/schema";

// ============================================================================
// EXTENDED TYPES (com campos relacionados de JOIN)
// ============================================================================

/**
 * Employee com campos relacionados (department, position, manager)
 */
export interface EmployeeWithRelations extends SchemaEmployee {
  departmentName?: string | null;
  positionTitle?: string | null;
  positionLevel?: string | null;
  department?: SchemaDepartment;
  position?: SchemaPosition;
  manager?: SchemaEmployee;
}

/**
 * Evaluation com campos relacionados (employee, cycle)
 */
export interface EvaluationWithRelations extends SchemaEvaluation {
  employee?: EmployeeWithRelations;
  cycle?: SchemaEvaluationCycle;
}

/**
 * Goal com campos relacionados (employee, cycle)
 * Nota: progress já existe no schema como campo obrigatório
 */
export interface GoalWithRelations extends SchemaGoal {
  employee?: EmployeeWithRelations;
  cycle?: SchemaEvaluationCycle;
}

/**
 * PDI com campos relacionados (employee, items)
 */
export interface PDIPlanWithRelations extends SchemaPDIPlan {
  employee?: EmployeeWithRelations;
  items?: SchemaPDIItem[];
}

/**
 * Nine Box com campos relacionados (employee)
 */
export interface NineBoxWithRelations extends SchemaNineBoxPosition {
  employee?: EmployeeWithRelations;
}

/**
 * Succession Plan com campos relacionados (position, employee)
 */
export interface SuccessionPlanWithRelations extends SchemaSuccessionPlan {
  position?: SchemaPosition;
  employee?: EmployeeWithRelations;
}

// ============================================================================
// UTILITY TYPES FOR CALLBACKS
// ============================================================================

/**
 * Type helper para callbacks .map() com Employee
 */
export type EmployeeMapCallback<T> = (
  employee: EmployeeWithRelations,
  index: number,
  array: EmployeeWithRelations[]
) => T;

/**
 * Type helper para callbacks .map() com Evaluation
 */
export type EvaluationMapCallback<T> = (
  evaluation: EvaluationWithRelations,
  index: number,
  array: EvaluationWithRelations[]
) => T;

/**
 * Type helper para callbacks .map() com Goal
 */
export type GoalMapCallback<T> = (
  goal: GoalWithRelations,
  index: number,
  array: GoalWithRelations[]
) => T;

/**
 * Type helper para callbacks .filter() com Employee
 */
export type EmployeeFilterCallback = (
  employee: EmployeeWithRelations,
  index: number,
  array: EmployeeWithRelations[]
) => boolean;

/**
 * Type helper para callbacks .filter() com Evaluation
 */
export type EvaluationFilterCallback = (
  evaluation: EvaluationWithRelations,
  index: number,
  array: EvaluationWithRelations[]
) => boolean;

/**
 * Type helper para callbacks .filter() com Goal
 */
export type GoalFilterCallback = (
  goal: GoalWithRelations,
  index: number,
  array: GoalWithRelations[]
) => boolean;

// ============================================================================
// COMMON RESPONSE TYPES
// ============================================================================

/**
 * Resposta padrão de API com dados e metadados
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Estatísticas de dashboard
 */
export interface DashboardStats {
  totalEmployees: number;
  activeEvaluations: number;
  completedGoals: number;
  pendingApprovals: number;
}
