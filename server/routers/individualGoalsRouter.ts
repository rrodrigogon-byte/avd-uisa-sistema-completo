import { z } from "zod";
import { eq, and, desc, sql, inArray, gte, lte, isNull, or } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  individualGoals, 
  individualGoalProgress, 
  departmentGoals,
  employees,
  departments,
  evaluationCycles
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const individualGoalsRouter = router({
  // Listar metas individuais de um colaborador
  list: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      status: z.enum(["rascunho", "pendente_aprovacao", "aprovada", "em_andamento", "concluida", "cancelada", "atrasada"]).optional(),
      cycleId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input.employeeId) {
        conditions.push(eq(individualGoals.employeeId, input.employeeId));
      }
      
      if (input.status) {
        conditions.push(eq(individualGoals.status, input.status));
      }
      
      if (input.cycleId) {
        conditions.push(eq(individualGoals.cycleId, input.cycleId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const goals = await db
        .select({
          id: individualGoals.id,
          employeeId: individualGoals.employeeId,
          departmentGoalId: individualGoals.departmentGoalId,
          cycleId: individualGoals.cycleId,
          title: individualGoals.title,
          description: individualGoals.description,
          specific: individualGoals.specific,
          measurable: individualGoals.measurable,
          achievable: individualGoals.achievable,
          relevant: individualGoals.relevant,
          timeBound: individualGoals.timeBound,
          targetValue: individualGoals.targetValue,
          currentValue: individualGoals.currentValue,
          unit: individualGoals.unit,
          weight: individualGoals.weight,
          priority: individualGoals.priority,
          startDate: individualGoals.startDate,
          dueDate: individualGoals.dueDate,
          completedAt: individualGoals.completedAt,
          status: individualGoals.status,
          progressPercent: individualGoals.progressPercent,
          approvedBy: individualGoals.approvedBy,
          approvedAt: individualGoals.approvedAt,
          rejectionReason: individualGoals.rejectionReason,
          createdAt: individualGoals.createdAt,
          updatedAt: individualGoals.updatedAt,
          employeeName: employees.name,
          departmentGoalTitle: departmentGoals.title,
        })
        .from(individualGoals)
        .leftJoin(employees, eq(individualGoals.employeeId, employees.id))
        .leftJoin(departmentGoals, eq(individualGoals.departmentGoalId, departmentGoals.id))
        .where(whereClause)
        .orderBy(desc(individualGoals.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return goals;
    }),

  // Obter uma meta individual por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [goal] = await db
        .select()
        .from(individualGoals)
        .where(eq(individualGoals.id, input.id))
        .limit(1);

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta não encontrada" });
      }

      // Buscar histórico de progresso
      const progressHistory = await db
        .select()
        .from(individualGoalProgress)
        .where(eq(individualGoalProgress.goalId, input.id))
        .orderBy(desc(individualGoalProgress.recordedAt));

      return { ...goal, progressHistory };
    }),

  // Criar nova meta individual
  create: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      departmentGoalId: z.number().optional(),
      cycleId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      specific: z.string().optional(),
      measurable: z.string().optional(),
      achievable: z.string().optional(),
      relevant: z.string().optional(),
      timeBound: z.string().optional(),
      targetValue: z.number().optional(),
      unit: z.string().optional(),
      weight: z.number().min(1).max(100).default(10),
      priority: z.enum(["baixa", "media", "alta", "critica"]).default("media"),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(individualGoals).values({
        employeeId: input.employeeId,
        departmentGoalId: input.departmentGoalId,
        cycleId: input.cycleId,
        title: input.title,
        description: input.description,
        specific: input.specific,
        measurable: input.measurable,
        achievable: input.achievable,
        relevant: input.relevant,
        timeBound: input.timeBound,
        targetValue: input.targetValue,
        currentValue: 0,
        unit: input.unit,
        weight: input.weight,
        priority: input.priority,
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: "rascunho",
        progressPercent: 0,
        createdBy: ctx.user.id,
      });

      return { id: result.insertId, success: true };
    }),

  // Atualizar meta individual
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      specific: z.string().optional(),
      measurable: z.string().optional(),
      achievable: z.string().optional(),
      relevant: z.string().optional(),
      timeBound: z.string().optional(),
      targetValue: z.number().optional(),
      unit: z.string().optional(),
      weight: z.number().min(1).max(100).optional(),
      priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      status: z.enum(["rascunho", "pendente_aprovacao", "aprovada", "em_andamento", "concluida", "cancelada", "atrasada"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: Record<string, unknown> = {};
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.specific !== undefined) updateData.specific = input.specific;
      if (input.measurable !== undefined) updateData.measurable = input.measurable;
      if (input.achievable !== undefined) updateData.achievable = input.achievable;
      if (input.relevant !== undefined) updateData.relevant = input.relevant;
      if (input.timeBound !== undefined) updateData.timeBound = input.timeBound;
      if (input.targetValue !== undefined) updateData.targetValue = input.targetValue;
      if (input.unit !== undefined) updateData.unit = input.unit;
      if (input.weight !== undefined) updateData.weight = input.weight;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
      if (input.dueDate !== undefined) updateData.dueDate = new Date(input.dueDate);
      if (input.status !== undefined) updateData.status = input.status;

      await db
        .update(individualGoals)
        .set(updateData)
        .where(eq(individualGoals.id, input.id));

      return { success: true };
    }),

  // Atualizar progresso da meta
  updateProgress: protectedProcedure
    .input(z.object({
      goalId: z.number(),
      newValue: z.number(),
      comment: z.string().optional(),
      evidence: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar meta atual
      const [goal] = await db
        .select()
        .from(individualGoals)
        .where(eq(individualGoals.id, input.goalId))
        .limit(1);

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta não encontrada" });
      }

      // Calcular novo percentual
      const newPercent = goal.targetValue && goal.targetValue > 0
        ? Math.min(100, Math.round((input.newValue / goal.targetValue) * 100))
        : 0;

      // Registrar histórico de progresso
      await db.insert(individualGoalProgress).values({
        goalId: input.goalId,
        previousValue: goal.currentValue,
        newValue: input.newValue,
        previousPercent: goal.progressPercent,
        newPercent: newPercent,
        comment: input.comment,
        evidence: input.evidence,
        recordedBy: ctx.user.id,
      });

      // Atualizar meta
      const newStatus = newPercent >= 100 ? "concluida" : 
                       goal.status === "rascunho" ? "em_andamento" : goal.status;

      await db
        .update(individualGoals)
        .set({
          currentValue: input.newValue,
          progressPercent: newPercent,
          status: newStatus,
          completedAt: newPercent >= 100 ? new Date() : null,
        })
        .where(eq(individualGoals.id, input.goalId));

      return { success: true, newPercent, newStatus };
    }),

  // Aprovar meta
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(individualGoals)
        .set({
          status: "aprovada",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        })
        .where(eq(individualGoals.id, input.id));

      return { success: true };
    }),

  // Rejeitar meta
  reject: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(individualGoals)
        .set({
          status: "rascunho",
          rejectionReason: input.reason,
        })
        .where(eq(individualGoals.id, input.id));

      return { success: true };
    }),

  // Excluir meta
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Excluir histórico de progresso primeiro
      await db.delete(individualGoalProgress).where(eq(individualGoalProgress.goalId, input.id));
      
      // Excluir meta
      await db.delete(individualGoals).where(eq(individualGoals.id, input.id));

      return { success: true };
    }),

  // Desdobrar meta departamental em metas individuais
  createFromDepartmentGoal: protectedProcedure
    .input(z.object({
      departmentGoalId: z.number(),
      employeeIds: z.array(z.number()),
      weightDistribution: z.enum(["equal", "custom"]).default("equal"),
      customWeights: z.array(z.object({
        employeeId: z.number(),
        weight: z.number(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar meta departamental
      const [deptGoal] = await db
        .select()
        .from(departmentGoals)
        .where(eq(departmentGoals.id, input.departmentGoalId))
        .limit(1);

      if (!deptGoal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta departamental não encontrada" });
      }

      // Calcular peso por colaborador
      const totalEmployees = input.employeeIds.length;
      const equalWeight = Math.floor(100 / totalEmployees);

      const createdGoals = [];

      for (const employeeId of input.employeeIds) {
        const weight = input.weightDistribution === "custom" && input.customWeights
          ? input.customWeights.find(w => w.employeeId === employeeId)?.weight || equalWeight
          : equalWeight;

        const [result] = await db.insert(individualGoals).values({
          employeeId,
          departmentGoalId: input.departmentGoalId,
          cycleId: deptGoal.cycleId,
          title: `${deptGoal.title} - Contribuição Individual`,
          description: deptGoal.description,
          targetValue: deptGoal.targetValue ? Math.round((deptGoal.targetValue * weight) / 100) : null,
          currentValue: 0,
          unit: deptGoal.unit,
          weight,
          priority: "media",
          startDate: deptGoal.startDate,
          dueDate: deptGoal.dueDate,
          status: "pendente_aprovacao",
          progressPercent: 0,
          createdBy: ctx.user.id,
        });

        createdGoals.push({ employeeId, goalId: result.insertId });
      }

      return { success: true, createdGoals };
    }),

  // Estatísticas de metas por colaborador
  getStats: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      departmentId: z.number().optional(),
      cycleId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input.employeeId) {
        conditions.push(eq(individualGoals.employeeId, input.employeeId));
      }
      
      if (input.cycleId) {
        conditions.push(eq(individualGoals.cycleId, input.cycleId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const allGoals = await db
        .select({
          status: individualGoals.status,
          progressPercent: individualGoals.progressPercent,
          weight: individualGoals.weight,
        })
        .from(individualGoals)
        .where(whereClause);

      const total = allGoals.length;
      const concluidas = allGoals.filter(g => g.status === "concluida").length;
      const emAndamento = allGoals.filter(g => g.status === "em_andamento").length;
      const atrasadas = allGoals.filter(g => g.status === "atrasada").length;
      const pendentes = allGoals.filter(g => g.status === "pendente_aprovacao").length;

      // Calcular média ponderada de progresso
      const totalWeight = allGoals.reduce((sum, g) => sum + (g.weight || 0), 0);
      const weightedProgress = totalWeight > 0
        ? allGoals.reduce((sum, g) => sum + ((g.progressPercent || 0) * (g.weight || 0)), 0) / totalWeight
        : 0;

      return {
        total,
        concluidas,
        emAndamento,
        atrasadas,
        pendentes,
        taxaConclusao: total > 0 ? Math.round((concluidas / total) * 100) : 0,
        progressoMedioPonderado: Math.round(weightedProgress),
      };
    }),
});
