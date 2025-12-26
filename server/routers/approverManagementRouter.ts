import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  approverRoles,
  approverAssignments,
  employees,
} from "../../drizzle/schema";
import { eq, and, or, isNull, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Gestão de Aprovadores
 * Sistema dinâmico e flexível para configurar aprovadores por papel/função
 */
export const approverManagementRouter = router({
  /**
   * Listar todos os papéis de aprovadores
   */
  listRoles: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const roles = await db
      .select()
      .from(approverRoles)
      .where(eq(approverRoles.active, true))
      .orderBy(approverRoles.level);

    return roles;
  }),

  /**
   * Listar aprovadores ativos por papel
   */
  getApproversByRole: protectedProcedure
    .input(
      z.object({
        roleCode: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar papel
      const [role] = await db
        .select()
        .from(approverRoles)
        .where(
          and(
            eq(approverRoles.code, input.roleCode),
            eq(approverRoles.active, true)
          )
        )
        .limit(1);

      if (!role) return [];

      // Buscar aprovadores ativos
      const approvers = await db
        .select({
          assignment: approverAssignments,
          employee: employees,
        })
        .from(approverAssignments)
        .innerJoin(
          employees,
          eq(approverAssignments.employeeId, employees.id)
        )
        .where(
          and(
            eq(approverAssignments.roleId, role.id),
            eq(approverAssignments.active, true),
            eq(employees.active, true), // VALIDAÇÃO DE STATUS ATIVO
            or(
              isNull(approverAssignments.endDate),
              sql`${approverAssignments.endDate} > NOW()`
            )
          )
        );

      return approvers;
    }),

  /**
   * Atribuir aprovador a um papel
   */
  assignApprover: adminProcedure
    .input(
      z.object({
        roleCode: z.string(),
        employeeId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar papel
      const [role] = await db
        .select()
        .from(approverRoles)
        .where(eq(approverRoles.code, input.roleCode))
        .limit(1);

      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Papel de aprovador não encontrado",
        });
      }

      // Verificar se employee existe e está ativo
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      if (!employee.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível atribuir aprovador inativo",
        });
      }

      // Criar atribuição
      await db.insert(approverAssignments).values({
        roleId: role.id,
        employeeId: input.employeeId,
        startDate: input.startDate || new Date(),
        endDate: input.endDate || null,
        isDelegated: false,
        active: true,
        createdBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Remover aprovador de um papel
   */
  removeApprover: adminProcedure
    .input(
      z.object({
        assignmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(approverAssignments)
        .set({
          active: false,
          endDate: new Date(),
        })
        .where(eq(approverAssignments.id, input.assignmentId));

      return { success: true };
    }),

  /**
   * Delegar aprovação (para férias/ausências)
   */
  delegateApproval: protectedProcedure
    .input(
      z.object({
        roleCode: z.string(),
        delegateToEmployeeId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee do usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Funcionário não encontrado",
        });
      }

      // Buscar papel
      const [role] = await db
        .select()
        .from(approverRoles)
        .where(eq(approverRoles.code, input.roleCode))
        .limit(1);

      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Papel de aprovador não encontrado",
        });
      }

      // Verificar se employee delegado existe e está ativo
      const [delegateEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.delegateToEmployeeId))
        .limit(1);

      if (!delegateEmployee || !delegateEmployee.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Funcionário delegado não encontrado ou inativo",
        });
      }

      // Criar delegação
      await db.insert(approverAssignments).values({
        roleId: role.id,
        employeeId: input.delegateToEmployeeId,
        startDate: input.startDate,
        endDate: input.endDate,
        isDelegated: true,
        delegatedBy: employee.id,
        delegationReason: input.reason,
        active: true,
        createdBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Buscar aprovador ativo para um papel específico
   * Retorna o primeiro aprovador ativo encontrado
   */
  getActiveApproverForRole: protectedProcedure
    .input(
      z.object({
        roleCode: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Buscar papel
      const [role] = await db
        .select()
        .from(approverRoles)
        .where(
          and(
            eq(approverRoles.code, input.roleCode),
            eq(approverRoles.active, true)
          )
        )
        .limit(1);

      if (!role) return null;

      // Buscar primeiro aprovador ativo
      const [approver] = await db
        .select({
          assignment: approverAssignments,
          employee: employees,
        })
        .from(approverAssignments)
        .innerJoin(
          employees,
          eq(approverAssignments.employeeId, employees.id)
        )
        .where(
          and(
            eq(approverAssignments.roleId, role.id),
            eq(approverAssignments.active, true),
            eq(employees.active, true), // VALIDAÇÃO DE STATUS ATIVO
            or(
              isNull(approverAssignments.endDate),
              sql`${approverAssignments.endDate} > NOW()`
            )
          )
        )
        .limit(1);

      return approver || null;
    }),

  /**
   * Listar todas as atribuições de um funcionário
   */
  getEmployeeAssignments: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const assignments = await db
        .select({
          assignment: approverAssignments,
          role: approverRoles,
        })
        .from(approverAssignments)
        .innerJoin(
          approverRoles,
          eq(approverAssignments.roleId, approverRoles.id)
        )
        .where(
          and(
            eq(approverAssignments.employeeId, input.employeeId),
            eq(approverAssignments.active, true)
          )
        );

      return assignments;
    }),
});
