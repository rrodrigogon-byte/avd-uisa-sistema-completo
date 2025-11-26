import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  listEmployees,
  upsertEmployee,
  deactivateEmployee,
  reactivateEmployee,
  logEmployeeAudit,
  getEmployeeAuditLog,
} from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Router para Gestão Completa de Funcionários (Item 1)
 */
export const employeesRouter = router({
  /**
   * Listar funcionários com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        status: z.enum(["ativo", "afastado", "desligado"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await listEmployees(input);
    }),

  /**
   * Obter funcionário por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getEmployeeById } = await import("../db");
      return await getEmployeeById(input.id);
    }),

  /**
   * Criar funcionário
   */
  create: protectedProcedure
    .input(
      z.object({
        employeeCode: z.string().min(1),
        name: z.string().min(3),
        email: z.string().email(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        hireDate: z.string(),
        departmentId: z.number(),
        positionId: z.number(),
        managerId: z.number().optional(),
        salary: z.number().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se usuário tem permissão (admin ou RH)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem criar funcionários",
        });
      }

      const employeeId = await upsertEmployee({
        ...input,
        active: true,
        status: "ativo",
      });

      // Registrar auditoria
      await logEmployeeAudit({
        employeeId,
        action: "criado",
        changedBy: ctx.user.id,
      });

      return { id: employeeId, success: true };
    }),

  /**
   * Atualizar funcionário
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        email: z.string().email().optional(),
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        managerId: z.number().optional(),
        salary: z.number().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem atualizar funcionários",
        });
      }

      const { id, ...updateData } = input;
      await upsertEmployee({ id, ...updateData });

      // Registrar auditoria para cada campo alterado
      for (const [field, value] of Object.entries(updateData)) {
        await logEmployeeAudit({
          employeeId: id,
          action: "atualizado",
          fieldChanged: field,
          newValue: String(value),
          changedBy: ctx.user.id,
        });
      }

      return { success: true };
    }),

  /**
   * Desativar funcionário
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem desativar funcionários",
        });
      }

      await deactivateEmployee(input.id);

      await logEmployeeAudit({
        employeeId: input.id,
        action: "desativado",
        changedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Reativar funcionário
   */
  reactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem reativar funcionários",
        });
      }

      await reactivateEmployee(input.id);

      await logEmployeeAudit({
        employeeId: input.id,
        action: "reativado",
        changedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Obter histórico de auditoria
   */
  auditLog: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem ver logs de auditoria",
        });
      }

      return await getEmployeeAuditLog(input.employeeId);
    }),

  /**
   * Importar funcionários em lote (placeholder)
   */
  importBatch: protectedProcedure
    .input(
      z.object({
        fileUrl: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem importar funcionários",
        });
      }

      // TODO: Implementar lógica de importação
      // Por enquanto, apenas registrar a tentativa
      const { employeeImportHistory } = await import("../../drizzle/schema");
      const { getDb } = await import("../db");
      const db = await getDb();

      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db.insert(employeeImportHistory).values({
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        totalRecords: 0,
        successCount: 0,
        errorCount: 0,
        status: "processando",
        importedBy: ctx.user.id,
      });

      return {
        importId: result[0].insertId,
        message: "Importação iniciada. Processamento em andamento.",
      };
    }),

  /**
   * Exportar lista de funcionários
   */
  export: protectedProcedure
    .input(
      z.object({
        format: z.enum(["csv", "excel"]),
        filters: z
          .object({
            departmentId: z.number().optional(),
            positionId: z.number().optional(),
            status: z.enum(["ativo", "afastado", "desligado"]).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem exportar dados",
        });
      }

      const employees = await listEmployees(input.filters);

      // TODO: Implementar geração de arquivo CSV/Excel
      // Por enquanto, retornar os dados
      return {
        data: employees,
        format: input.format,
        count: employees.length,
      };
    }),
});
