import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  employees, 
  employeeCompetencies, 
  competencies,
  goals, 
  performanceEvaluations,
  pdiPlans,
  pdiItems,
  departments,
  positions
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Perfil Completo do Funcionário
 * Todas as operações CRUD para dados pessoais, competências, avaliações, metas e PDI
 */
export const employeeProfileRouter = router({
  /**
   * Atualizar dados pessoais do funcionário
   */
  updatePersonalInfo: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        name: z.string().min(3).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        hireDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar permissão (admin, RH ou próprio funcionário)
      const employee = await db.select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (employee.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      const isOwner = employee[0].userId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "rh";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para editar este funcionário",
        });
      }

      const { employeeId, hireDate, ...updateData } = input;
      
      await db.update(employees)
        .set({
          ...updateData,
          ...(hireDate && { hireDate: new Date(hireDate) }),
          updatedAt: new Date(),
        })
        .where(eq(employees.id, employeeId));

      return { success: true };
    }),

  /**
   * Listar competências do funcionário
   */
  listCompetencies: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select({
          id: employeeCompetencies.id,
          competencyId: employeeCompetencies.competencyId,
          competencyName: competencies.name,
          competencyCategory: competencies.category,
          competencyDescription: competencies.description,
          currentLevel: employeeCompetencies.currentLevel,
          evaluatedAt: employeeCompetencies.evaluatedAt,
          evaluatedBy: employeeCompetencies.evaluatedBy,
        })
        .from(employeeCompetencies)
        .leftJoin(competencies, eq(employeeCompetencies.competencyId, competencies.id))
        .where(eq(employeeCompetencies.employeeId, input.employeeId))
        .orderBy(desc(employeeCompetencies.evaluatedAt));

      return result;
    }),

  /**
   * Adicionar competência ao funcionário
   */
  addCompetency: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        competencyId: z.number(),
        currentLevel: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se já existe
      const existing = await db
        .select()
        .from(employeeCompetencies)
        .where(
          and(
            eq(employeeCompetencies.employeeId, input.employeeId),
            eq(employeeCompetencies.competencyId, input.competencyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Esta competência já foi adicionada",
        });
      }

      await db.insert(employeeCompetencies).values({
        employeeId: input.employeeId,
        competencyId: input.competencyId,
        currentLevel: input.currentLevel,
        evaluatedAt: new Date(),
        evaluatedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Atualizar nível de competência
   */
  updateCompetency: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        currentLevel: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(employeeCompetencies)
        .set({
          currentLevel: input.currentLevel,
          evaluatedAt: new Date(),
          evaluatedBy: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(employeeCompetencies.id, input.id));

      return { success: true };
    }),

  /**
   * Remover competência
   */
  removeCompetency: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(employeeCompetencies)
        .where(eq(employeeCompetencies.id, input.id));

      return { success: true };
    }),

  /**
   * Listar todas as competências disponíveis
   */
  listAvailableCompetencies: protectedProcedure.input(z.object({})).query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(competencies)
      .where(eq(competencies.active, true))
      .orderBy(competencies.name);

    return result;
  }),

  /**
   * Criar nova avaliação
   */
  createEvaluation: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        cycleId: z.number(),
        type: z.enum(["360", "180", "90"]).default("180"),
        selfScore: z.number().min(0).max(100).optional(),
        managerScore: z.number().min(0).max(100).optional(),
        finalScore: z.number().min(0).max(100).optional(),
        managerComments: z.string().optional(),
        status: z.enum(["pendente", "em_andamento", "concluida"]).default("pendente"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(performanceEvaluations).values({
        employeeId: input.employeeId,
        cycleId: input.cycleId,
        type: input.type,
        selfScore: input.selfScore,
        managerScore: input.managerScore,
        finalScore: input.finalScore,
        managerComments: input.managerComments,
        status: input.status,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Atualizar avaliação
   */
  updateEvaluation: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        selfScore: z.number().min(0).max(100).optional(),
        managerScore: z.number().min(0).max(100).optional(),
        finalScore: z.number().min(0).max(100).optional(),
        managerComments: z.string().optional(),
        status: z.enum(["pendente", "em_andamento", "concluida"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(performanceEvaluations)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, id));

      return { success: true };
    }),

  /**
   * Excluir avaliação
   */
  deleteEvaluation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar permissão (apenas admin/RH)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem excluir avaliações",
        });
      }

      await db
        .delete(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.id));

      return { success: true };
    }),

  /**
   * Criar nova meta/objetivo
   */
  createGoal: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        title: z.string().min(3),
        description: z.string().optional(),
        specific: z.string().optional(),
        measurable: z.string().optional(),
        achievable: z.string().optional(),
        relevant: z.string().optional(),
        timeBound: z.string().optional(),
        deadline: z.string().optional(),
        progress: z.number().min(0).max(100).default(0),
        cycleId: z.number(),
        type: z.enum(["individual", "equipe", "organizacional"]).default("individual"),
        category: z.enum(["quantitativa", "qualitativa"]).default("qualitativa"),
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(["rascunho", "pendente_aprovacao", "aprovada", "em_andamento", "concluida", "cancelada"]).default("rascunho"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(goals).values({
        employeeId: input.employeeId,
        cycleId: input.cycleId,
        title: input.title,
        description: input.description,
        type: input.type,
        category: input.category,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: input.status,
        progress: input.progress,
        createdBy: ctx.user.id,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Atualizar meta/objetivo
   */
  updateGoal: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3).optional(),
        description: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
        status: z.enum(["rascunho", "pendente_aprovacao", "aprovada", "em_andamento", "concluida", "cancelada"]).optional(),
        deadline: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(goals)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(goals.id, id));

      return { success: true };
    }),

  /**
   * Excluir meta/objetivo
   */
  deleteGoal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(goals).where(eq(goals.id, input.id));

      return { success: true };
    }),

  /**
   * Criar novo PDI
   */
  createPDI: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        cycleId: z.number(),
        targetPositionId: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).default("rascunho"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(pdiPlans).values({
        employeeId: input.employeeId,
        cycleId: input.cycleId,
        targetPositionId: input.targetPositionId,
        status: input.status,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Atualizar PDI
   */
  updatePDI: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        targetPositionId: z.number().optional(),
        status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).optional(),
        overallProgress: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(pdiPlans)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(pdiPlans.id, id));

      return { success: true };
    }),

  /**
   * Excluir PDI
   */
  deletePDI: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Excluir itens do PDI primeiro
      await db.delete(pdiItems).where(eq(pdiItems.planId, input.id));

      // Excluir o PDI
      await db.delete(pdiPlans).where(eq(pdiPlans.id, input.id));

      return { success: true };
    }),
});
