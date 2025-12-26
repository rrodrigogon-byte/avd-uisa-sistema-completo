import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { employees, auditLogs, departments, positions } from "../drizzle/schema";
import { eq, and, or, like, sql, isNull, desc } from "drizzle-orm";

/**
 * Router de Gerenciamento de Funcionários
 * 
 * Funcionalidades:
 * - Movimentação de funcionários entre departamentos/gestores
 * - Exclusão lógica (soft delete) com reflexo em todo o sistema
 * - Histórico de movimentações com auditoria
 * - Ajustes de hierarquia organizacional
 */

export const employeeManagementRouter = router({
  /**
   * Buscar funcionários com filtros avançados
   */
  searchEmployees: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        departmentId: z.number().optional(),
        managerId: z.number().optional(),
        active: z.boolean().optional(),
        includeInactive: z.boolean().default(false),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input?.search) {
        conditions.push(
          or(
            like(employees.name, `%${input.search}%`),
            like(employees.email, `%${input.search}%`),
            like(employees.employeeCode, `%${input.search}%`)
          )
        );
      }

      if (input?.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      if (input?.managerId) {
        conditions.push(eq(employees.managerId, input.managerId));
      }

      if (input?.active !== undefined) {
        conditions.push(eq(employees.active, input.active));
      } else if (!input?.includeInactive) {
        conditions.push(eq(employees.active, true));
      }

      const results = await db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          name: employees.name,
          email: employees.email,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
          managerId: employees.managerId,
          active: employees.active,
          gerencia: employees.gerencia,
          diretoria: employees.diretoria,
          secao: employees.secao,
          hireDate: employees.hireDate,
        })
        .from(employees)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(employees.name);

      // Buscar nomes dos gestores
      const managerIds = [...new Set(results.map(r => r.managerId).filter(Boolean))];
      const managers = managerIds.length > 0 
        ? await db.select({
            id: employees.id,
            name: employees.name,
          })
          .from(employees)
          .where(sql`${employees.id} IN (${sql.join(managerIds, sql`, `)})`)
        : [];

      const managerMap = new Map(managers.map(m => [m.id, m.name]));

      return results.map(emp => ({
        ...emp,
        managerName: emp.managerId ? managerMap.get(emp.managerId) : null,
      }));
    }),

  /**
   * Movimentar funcionário (alterar departamento, gestor ou cargo)
   */
  moveEmployee: adminProcedure
    .input(
      z.object({
        employeeId: z.number(),
        departmentId: z.number().optional(),
        managerId: z.number().optional(),
        positionId: z.number().optional(),
        reason: z.string().optional(),
        effectiveDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar dados atuais do funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Preparar dados de atualização
      const updates: any = {};
      const changes: string[] = [];

      if (input.departmentId !== undefined && input.departmentId !== employee.departmentId) {
        updates.departmentId = input.departmentId;
        changes.push(`Departamento alterado`);
      }

      if (input.managerId !== undefined && input.managerId !== employee.managerId) {
        // Validar que o novo gestor existe e está ativo
        if (input.managerId) {
          const [manager] = await db
            .select()
            .from(employees)
            .where(and(eq(employees.id, input.managerId), eq(employees.active, true)))
            .limit(1);

          if (!manager) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Gestor inválido ou inativo" });
          }
        }
        updates.managerId = input.managerId;
        changes.push(`Gestor alterado`);
      }

      if (input.positionId !== undefined && input.positionId !== employee.positionId) {
        updates.positionId = input.positionId;
        changes.push(`Cargo alterado`);
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma alteração especificada" });
      }

      // Atualizar funcionário
      await db
        .update(employees)
        .set(updates)
        .where(eq(employees.id, input.employeeId));

      // Registrar auditoria
      await db.insert(auditLogs).values({
        entityType: "employee",
        entityId: input.employeeId,
        action: "movimentacao",
        userId: ctx.user.id,
        userName: ctx.user.name || "Sistema",
        changes: JSON.stringify({
          before: {
            departmentId: employee.departmentId,
            managerId: employee.managerId,
            positionId: employee.positionId,
          },
          after: updates,
          reason: input.reason,
          effectiveDate: input.effectiveDate,
        }),
        description: `Movimentação: ${changes.join(", ")}`,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: `Funcionário movimentado com sucesso: ${changes.join(", ")}`,
      };
    }),

  /**
   * Movimentação em lote
   */
  batchMoveEmployees: adminProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()),
        departmentId: z.number().optional(),
        managerId: z.number().optional(),
        positionId: z.number().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const employeeId of input.employeeIds) {
        try {
          // Buscar dados atuais
          const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, employeeId))
            .limit(1);

          if (!employee) {
            results.failed++;
            results.errors.push(`Funcionário ${employeeId} não encontrado`);
            continue;
          }

          // Preparar atualizações
          const updates: any = {};
          if (input.departmentId !== undefined) updates.departmentId = input.departmentId;
          if (input.managerId !== undefined) updates.managerId = input.managerId;
          if (input.positionId !== undefined) updates.positionId = input.positionId;

          if (Object.keys(updates).length === 0) continue;

          // Atualizar
          await db
            .update(employees)
            .set(updates)
            .where(eq(employees.id, employeeId));

          // Registrar auditoria
          await db.insert(auditLogs).values({
            entityType: "employee",
            entityId: employeeId,
            action: "movimentacao_lote",
            userId: ctx.user.id,
            userName: ctx.user.name || "Sistema",
            changes: JSON.stringify({
              before: {
                departmentId: employee.departmentId,
                managerId: employee.managerId,
                positionId: employee.positionId,
              },
              after: updates,
              reason: input.reason,
            }),
            description: `Movimentação em lote`,
            createdAt: new Date(),
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Erro ao movimentar funcionário ${employeeId}: ${error}`);
        }
      }

      return results;
    }),

  /**
   * Desativar funcionário (soft delete)
   */
  deactivateEmployee: adminProcedure
    .input(
      z.object({
        employeeId: z.number(),
        reason: z.string().optional(),
        terminationDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se funcionário existe
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      if (!employee.active) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Funcionário já está inativo" });
      }

      // Desativar funcionário
      await db
        .update(employees)
        .set({ active: false })
        .where(eq(employees.id, input.employeeId));

      // Registrar auditoria
      await db.insert(auditLogs).values({
        entityType: "employee",
        entityId: input.employeeId,
        action: "desativacao",
        userId: ctx.user.id,
        userName: ctx.user.name || "Sistema",
        changes: JSON.stringify({
          reason: input.reason,
          terminationDate: input.terminationDate,
        }),
        description: `Funcionário desativado: ${input.reason || "Sem motivo especificado"}`,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Funcionário desativado com sucesso",
      };
    }),

  /**
   * Reativar funcionário
   */
  reactivateEmployee: adminProcedure
    .input(
      z.object({
        employeeId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se funcionário existe
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      if (employee.active) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Funcionário já está ativo" });
      }

      // Reativar funcionário
      await db
        .update(employees)
        .set({ active: true })
        .where(eq(employees.id, input.employeeId));

      // Registrar auditoria
      await db.insert(auditLogs).values({
        entityType: "employee",
        entityId: input.employeeId,
        action: "reativacao",
        userId: ctx.user.id,
        userName: ctx.user.name || "Sistema",
        changes: JSON.stringify({
          reason: input.reason,
        }),
        description: `Funcionário reativado: ${input.reason || "Sem motivo especificado"}`,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Funcionário reativado com sucesso",
      };
    }),

  /**
   * Desativação em lote
   */
  batchDeactivateEmployees: adminProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const employeeId of input.employeeIds) {
        try {
          const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, employeeId))
            .limit(1);

          if (!employee) {
            results.failed++;
            results.errors.push(`Funcionário ${employeeId} não encontrado`);
            continue;
          }

          if (!employee.active) {
            results.failed++;
            results.errors.push(`Funcionário ${employeeId} já está inativo`);
            continue;
          }

          await db
            .update(employees)
            .set({ active: false })
            .where(eq(employees.id, employeeId));

          await db.insert(auditLogs).values({
            entityType: "employee",
            entityId: employeeId,
            action: "desativacao_lote",
            userId: ctx.user.id,
            userName: ctx.user.name || "Sistema",
            changes: JSON.stringify({ reason: input.reason }),
            description: `Desativação em lote: ${input.reason || "Sem motivo"}`,
            createdAt: new Date(),
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Erro ao desativar funcionário ${employeeId}: ${error}`);
        }
      }

      return results;
    }),

  /**
   * Buscar histórico de movimentações de um funcionário
   */
  getEmployeeMovementHistory: adminProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const history = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "employee"),
            eq(auditLogs.entityId, input.employeeId),
            or(
              eq(auditLogs.action, "movimentacao"),
              eq(auditLogs.action, "movimentacao_lote"),
              eq(auditLogs.action, "desativacao"),
              eq(auditLogs.action, "reativacao")
            )
          )
        )
        .orderBy(desc(auditLogs.createdAt));

      return history.map(log => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes as string) : null,
      }));
    }),

  /**
   * Buscar funcionários por critérios específicos (para ajustes manuais)
   */
  findEmployeesByName: adminProcedure
    .input(z.object({ names: z.array(z.string()) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = input.names.map(name => like(employees.name, `%${name}%`));

      const results = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          managerId: employees.managerId,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
          gerencia: employees.gerencia,
          diretoria: employees.diretoria,
          secao: employees.secao,
          active: employees.active,
        })
        .from(employees)
        .where(or(...conditions))
        .orderBy(employees.name);

      // Buscar nomes dos gestores
      const managerIds = [...new Set(results.map(r => r.managerId).filter(Boolean))];
      const managers = managerIds.length > 0
        ? await db.select({
            id: employees.id,
            name: employees.name,
          })
          .from(employees)
          .where(sql`${employees.id} IN (${sql.join(managerIds, sql`, `)})`)
        : [];

      const managerMap = new Map(managers.map(m => [m.id, m.name]));

      return results.map(emp => ({
        ...emp,
        managerName: emp.managerId ? managerMap.get(emp.managerId) : null,
      }));
    }),

  /**
   * Buscar funcionários por departamento/gerência/diretoria
   */
  findEmployeesByOrganization: adminProcedure
    .input(
      z.object({
        gerencia: z.string().optional(),
        diretoria: z.string().optional(),
        secao: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];

      if (input?.gerencia) {
        conditions.push(like(employees.gerencia, `%${input.gerencia}%`));
      }

      if (input?.diretoria) {
        conditions.push(like(employees.diretoria, `%${input.diretoria}%`));
      }

      if (input?.secao) {
        conditions.push(like(employees.secao, `%${input.secao}%`));
      }

      const results = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          managerId: employees.managerId,
          gerencia: employees.gerencia,
          diretoria: employees.diretoria,
          secao: employees.secao,
          active: employees.active,
        })
        .from(employees)
        .where(conditions.length > 0 ? or(...conditions) : undefined)
        .orderBy(employees.name);

      return results;
    }),

  /**
   * Listar gestores ativos
   */
  listManagers: adminProcedure
    .input(z.object({}))
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar funcionários que são gestores (têm subordinados)
      const managers = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          departmentId: employees.departmentId,
        })
        .from(employees)
        .where(
          and(
            eq(employees.active, true),
            sql`${employees.id} IN (SELECT DISTINCT managerId FROM ${employees} WHERE managerId IS NOT NULL)`
          )
        )
        .orderBy(employees.name);

      return managers;
    }),

  /**
   * Listar departamentos ativos
   */
  listDepartments: adminProcedure
    .input(z.object({}))
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const depts = await db
        .select({
          id: departments.id,
          code: departments.code,
          name: departments.name,
          description: departments.description,
        })
        .from(departments)
        .where(eq(departments.active, true))
        .orderBy(departments.name);

      return depts;
    }),

  /**
   * Listar cargos ativos
   */
  listPositions: adminProcedure
    .input(z.object({}))
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const pos = await db
        .select({
          id: positions.id,
          code: positions.code,
          title: positions.title,
          level: positions.level,
        })
        .from(positions)
        .where(eq(positions.active, true))
        .orderBy(positions.title);

      return pos;
    }),
});
