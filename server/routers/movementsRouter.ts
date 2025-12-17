import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { employeeMovements, employees, departments, positions } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

/**
 * Router de Movimentações de Colaboradores
 * Gerencia análise e estatísticas de movimentações organizacionais
 */
export const movementsRouter = router({
  /**
   * Listar movimentações com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        departmentId: z.number().optional(),
        movementType: z.enum([
          "promocao",
          "transferencia",
          "mudanca_gestor",
          "mudanca_cargo",
          "ajuste_salarial",
          "desligamento",
          "admissao",
          "retorno_afastamento",
          "reorganizacao",
          "outro"
        ]).optional(),
        approvalStatus: z.enum(["pendente", "aprovado", "rejeitado", "cancelado"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(employeeMovements.effectiveDate, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(employeeMovements.effectiveDate, new Date(input.endDate)));
      }

      if (input.departmentId) {
        conditions.push(eq(employeeMovements.newDepartmentId, input.departmentId));
      }

      if (input.movementType) {
        conditions.push(eq(employeeMovements.movementType, input.movementType));
      }

      if (input.approvalStatus) {
        conditions.push(eq(employeeMovements.approvalStatus, input.approvalStatus));
      }

      const movements = await db
        .select()
        .from(employeeMovements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(employeeMovements.effectiveDate))
        .limit(input.limit)
        .offset(input.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(employeeMovements)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        movements,
        total: totalResult?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Obter estatísticas de movimentações
   */
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(employeeMovements.effectiveDate, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(employeeMovements.effectiveDate, new Date(input.endDate)));
      }

      // Total de movimentações
      const [totalMovements] = await db
        .select({ count: count() })
        .from(employeeMovements)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Movimentações por tipo
      const movementsByType = await db
        .select({
          type: employeeMovements.movementType,
          count: count(),
        })
        .from(employeeMovements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(employeeMovements.movementType);

      // Movimentações por status de aprovação
      const movementsByStatus = await db
        .select({
          status: employeeMovements.approvalStatus,
          count: count(),
        })
        .from(employeeMovements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(employeeMovements.approvalStatus);

      return {
        total: totalMovements?.count || 0,
        byType: movementsByType,
        byStatus: movementsByStatus,
      };
    }),

  /**
   * Obter tendências de movimentações ao longo do tempo
   */
  getTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        groupBy: z.enum(["day", "week", "month"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Formato de data baseado no agrupamento
      let dateFormat: string;
      switch (input.groupBy) {
        case "day":
          dateFormat = "%Y-%m-%d";
          break;
        case "week":
          dateFormat = "%Y-%u";
          break;
        case "month":
        default:
          dateFormat = "%Y-%m";
          break;
      }

      const trends = await db
        .select({
          period: sql<string>`DATE_FORMAT(${employeeMovements.effectiveDate}, ${dateFormat})`,
          count: count(),
        })
        .from(employeeMovements)
        .where(
          and(
            gte(employeeMovements.effectiveDate, new Date(input.startDate)),
            lte(employeeMovements.effectiveDate, new Date(input.endDate))
          )
        )
        .groupBy(sql`DATE_FORMAT(${employeeMovements.effectiveDate}, ${dateFormat})`)
        .orderBy(sql`DATE_FORMAT(${employeeMovements.effectiveDate}, ${dateFormat})`);

      return trends;
    }),

  /**
   * Obter movimentações por departamento
   */
  getByDepartment: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(employeeMovements.effectiveDate, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(employeeMovements.effectiveDate, new Date(input.endDate)));
      }

      // Movimentações de entrada por departamento
      const incomingMovements = await db
        .select({
          departmentId: employeeMovements.newDepartmentId,
          count: count(),
        })
        .from(employeeMovements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(employeeMovements.newDepartmentId);

      // Movimentações de saída por departamento
      const outgoingMovements = await db
        .select({
          departmentId: employeeMovements.previousDepartmentId,
          count: count(),
        })
        .from(employeeMovements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(employeeMovements.previousDepartmentId);

      // Buscar nomes dos departamentos
      const departmentIds = [
        ...new Set([
          ...incomingMovements.map((m) => m.departmentId).filter((id) => id !== null),
          ...outgoingMovements.map((m) => m.departmentId).filter((id) => id !== null),
        ]),
      ];

      const departmentsData = await db
        .select({
          id: departments.id,
          name: departments.name,
        })
        .from(departments)
        .where(sql`${departments.id} IN (${departmentIds.join(",")})`);

      const departmentMap = new Map(departmentsData.map((d) => [d.id, d.name]));

      return {
        incoming: incomingMovements.map((m) => ({
          departmentId: m.departmentId,
          departmentName: m.departmentId ? departmentMap.get(m.departmentId) : "Não especificado",
          count: m.count,
        })),
        outgoing: outgoingMovements.map((m) => ({
          departmentId: m.departmentId,
          departmentName: m.departmentId ? departmentMap.get(m.departmentId) : "Não especificado",
          count: m.count,
        })),
      };
    }),

  /**
   * Criar nova movimentação
   */
  create: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        movementType: z.enum([
          "promocao",
          "transferencia",
          "mudanca_gestor",
          "mudanca_cargo",
          "ajuste_salarial",
          "desligamento",
          "admissao",
          "retorno_afastamento",
          "reorganizacao",
          "outro"
        ]),
        previousDepartmentId: z.number().optional(),
        previousPositionId: z.number().optional(),
        previousManagerId: z.number().optional(),
        newDepartmentId: z.number().optional(),
        newPositionId: z.number().optional(),
        newManagerId: z.number().optional(),
        effectiveDate: z.string(),
        reason: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Verificar se usuário tem permissão para criar movimentação
      const userRole = ctx.user.role;
      if (userRole !== "admin" && userRole !== "rh") {
        // Para gestores, verificar se é gestor direto
        if (userRole === "gestor") {
          const [managerEmployee] = await db
            .select()
            .from(employees)
            .where(eq(employees.userId, ctx.user.id))
            .limit(1);

          if (!managerEmployee) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Usuário gestor não está vinculado a um colaborador no sistema",
            });
          }

          const [targetEmployee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, input.employeeId))
            .limit(1);

          if (!targetEmployee || targetEmployee.managerId !== managerEmployee.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Você não é o gestor direto deste colaborador",
            });
          }
        } else {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores, RH e gestores podem criar movimentações",
          });
        }
      }

      // Buscar dados do colaborador associado ao usuário logado
      const [creatorEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!creatorEmployee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não está vinculado a um colaborador no sistema",
        });
      }

      // Criar movimentação
      const [movement] = await db
        .insert(employeeMovements)
        .values({
          employeeId: input.employeeId,
          movementType: input.movementType,
          previousDepartmentId: input.previousDepartmentId,
          previousPositionId: input.previousPositionId,
          previousManagerId: input.previousManagerId,
          newDepartmentId: input.newDepartmentId,
          newPositionId: input.newPositionId,
          newManagerId: input.newManagerId,
          effectiveDate: new Date(input.effectiveDate),
          reason: input.reason,
          notes: input.notes,
          approvalStatus: "pendente",
          createdBy: creatorEmployee.id,
        });

      return movement;
    }),

  /**
   * Aprovar movimentação
   */
  approve: protectedProcedure
    .input(
      z.object({
        movementId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Apenas admin e RH podem aprovar
      const userRole = ctx.user.role;
      if (userRole !== "admin" && userRole !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem aprovar movimentações",
        });
      }

      // Buscar dados do colaborador associado ao usuário logado
      const [approverEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!approverEmployee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não está vinculado a um colaborador no sistema",
        });
      }

      // Atualizar movimentação
      await db
        .update(employeeMovements)
        .set({
          approvalStatus: "aprovado",
          approvedBy: approverEmployee.id,
          approvedAt: new Date(),
        })
        .where(eq(employeeMovements.id, input.movementId));

      // Buscar movimentação atualizada
      const [movement] = await db
        .select()
        .from(employeeMovements)
        .where(eq(employeeMovements.id, input.movementId))
        .limit(1);

      // Aplicar mudanças no colaborador
      if (movement) {
        const updateData: any = {};

        if (movement.newDepartmentId) {
          updateData.departmentId = movement.newDepartmentId;
        }

        if (movement.newPositionId) {
          updateData.positionId = movement.newPositionId;
        }

        if (movement.newManagerId) {
          updateData.managerId = movement.newManagerId;
        }

        if (Object.keys(updateData).length > 0) {
          await db
            .update(employees)
            .set(updateData)
            .where(eq(employees.id, movement.employeeId));
        }
      }

      return movement;
    }),

  /**
   * Rejeitar movimentação
   */
  reject: protectedProcedure
    .input(
      z.object({
        movementId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Apenas admin e RH podem rejeitar
      const userRole = ctx.user.role;
      if (userRole !== "admin" && userRole !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem rejeitar movimentações",
        });
      }

      // Buscar dados do colaborador associado ao usuário logado
      const [approverEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!approverEmployee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não está vinculado a um colaborador no sistema",
        });
      }

      // Atualizar movimentação
      await db
        .update(employeeMovements)
        .set({
          approvalStatus: "rejeitado",
          approvedBy: approverEmployee.id,
          approvedAt: new Date(),
          notes: input.reason ? `Rejeitado: ${input.reason}` : undefined,
        })
        .where(eq(employeeMovements.id, input.movementId));

      const [movement] = await db
        .select()
        .from(employeeMovements)
        .where(eq(employeeMovements.id, input.movementId))
        .limit(1);

      return movement;
    }),
});
