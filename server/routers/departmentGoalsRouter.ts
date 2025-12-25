import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  departmentGoals, 
  individualGoals,
  departments,
  employees
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const departmentGoalsRouter = router({
  // Listar metas departamentais
  list: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      status: z.enum(["rascunho", "aprovada", "em_andamento", "concluida", "cancelada"]).optional(),
      cycleId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input.departmentId) {
        conditions.push(eq(departmentGoals.departmentId, input.departmentId));
      }
      
      if (input.status) {
        conditions.push(eq(departmentGoals.status, input.status));
      }
      
      if (input.cycleId) {
        conditions.push(eq(departmentGoals.cycleId, input.cycleId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const goals = await db
        .select({
          id: departmentGoals.id,
          departmentId: departmentGoals.departmentId,
          cycleId: departmentGoals.cycleId,
          title: departmentGoals.title,
          description: departmentGoals.description,
          targetValue: departmentGoals.targetValue,
          currentValue: departmentGoals.currentValue,
          unit: departmentGoals.unit,
          weight: departmentGoals.weight,
          startDate: departmentGoals.startDate,
          dueDate: departmentGoals.dueDate,
          status: departmentGoals.status,
          progressPercent: departmentGoals.progressPercent,
          createdAt: departmentGoals.createdAt,
          updatedAt: departmentGoals.updatedAt,
          departmentName: departments.name,
        })
        .from(departmentGoals)
        .leftJoin(departments, eq(departmentGoals.departmentId, departments.id))
        .where(whereClause)
        .orderBy(desc(departmentGoals.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return goals;
    }),

  // Obter meta departamental por ID com metas individuais vinculadas
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [goal] = await db
        .select()
        .from(departmentGoals)
        .where(eq(departmentGoals.id, input.id))
        .limit(1);

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta departamental não encontrada" });
      }

      // Buscar metas individuais vinculadas
      const linkedGoals = await db
        .select({
          id: individualGoals.id,
          employeeId: individualGoals.employeeId,
          title: individualGoals.title,
          weight: individualGoals.weight,
          progressPercent: individualGoals.progressPercent,
          status: individualGoals.status,
          employeeName: employees.name,
        })
        .from(individualGoals)
        .leftJoin(employees, eq(individualGoals.employeeId, employees.id))
        .where(eq(individualGoals.departmentGoalId, input.id));

      return { ...goal, linkedGoals };
    }),

  // Criar meta departamental
  create: protectedProcedure
    .input(z.object({
      departmentId: z.number(),
      cycleId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      targetValue: z.number().optional(),
      unit: z.string().optional(),
      weight: z.number().min(1).max(100).default(10),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(departmentGoals).values({
        departmentId: input.departmentId,
        cycleId: input.cycleId,
        title: input.title,
        description: input.description,
        targetValue: input.targetValue,
        currentValue: 0,
        unit: input.unit,
        weight: input.weight,
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: "rascunho",
        progressPercent: 0,
        createdBy: ctx.user.id,
      });

      return { id: result.insertId, success: true };
    }),

  // Atualizar meta departamental
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      targetValue: z.number().optional(),
      unit: z.string().optional(),
      weight: z.number().min(1).max(100).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      status: z.enum(["rascunho", "aprovada", "em_andamento", "concluida", "cancelada"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: Record<string, unknown> = {};
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.targetValue !== undefined) updateData.targetValue = input.targetValue;
      if (input.unit !== undefined) updateData.unit = input.unit;
      if (input.weight !== undefined) updateData.weight = input.weight;
      if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
      if (input.dueDate !== undefined) updateData.dueDate = new Date(input.dueDate);
      if (input.status !== undefined) updateData.status = input.status;

      await db
        .update(departmentGoals)
        .set(updateData)
        .where(eq(departmentGoals.id, input.id));

      return { success: true };
    }),

  // Atualizar progresso (calculado a partir das metas individuais)
  recalculateProgress: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar metas individuais vinculadas
      const linkedGoals = await db
        .select({
          weight: individualGoals.weight,
          progressPercent: individualGoals.progressPercent,
          currentValue: individualGoals.currentValue,
        })
        .from(individualGoals)
        .where(eq(individualGoals.departmentGoalId, input.id));

      if (linkedGoals.length === 0) {
        return { success: true, progress: 0 };
      }

      // Calcular progresso ponderado
      const totalWeight = linkedGoals.reduce((sum, g) => sum + (g.weight || 0), 0);
      const weightedProgress = totalWeight > 0
        ? linkedGoals.reduce((sum, g) => sum + ((g.progressPercent || 0) * (g.weight || 0)), 0) / totalWeight
        : 0;

      const totalCurrentValue = linkedGoals.reduce((sum, g) => sum + (g.currentValue || 0), 0);

      await db
        .update(departmentGoals)
        .set({
          progressPercent: Math.round(weightedProgress),
          currentValue: totalCurrentValue,
        })
        .where(eq(departmentGoals.id, input.id));

      return { success: true, progress: Math.round(weightedProgress) };
    }),

  // Excluir meta departamental
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se há metas individuais vinculadas
      const linkedGoals = await db
        .select({ id: individualGoals.id })
        .from(individualGoals)
        .where(eq(individualGoals.departmentGoalId, input.id));

      if (linkedGoals.length > 0) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Não é possível excluir meta departamental com metas individuais vinculadas" 
        });
      }

      await db.delete(departmentGoals).where(eq(departmentGoals.id, input.id));

      return { success: true };
    }),

  // Estatísticas de metas departamentais
  getStats: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      cycleId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input.departmentId) {
        conditions.push(eq(departmentGoals.departmentId, input.departmentId));
      }
      
      if (input.cycleId) {
        conditions.push(eq(departmentGoals.cycleId, input.cycleId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const allGoals = await db
        .select({
          status: departmentGoals.status,
          progressPercent: departmentGoals.progressPercent,
          weight: departmentGoals.weight,
        })
        .from(departmentGoals)
        .where(whereClause);

      const total = allGoals.length;
      const concluidas = allGoals.filter(g => g.status === "concluida").length;
      const emAndamento = allGoals.filter(g => g.status === "em_andamento").length;

      // Calcular média ponderada de progresso
      const totalWeight = allGoals.reduce((sum, g) => sum + (g.weight || 0), 0);
      const weightedProgress = totalWeight > 0
        ? allGoals.reduce((sum, g) => sum + ((g.progressPercent || 0) * (g.weight || 0)), 0) / totalWeight
        : 0;

      return {
        total,
        concluidas,
        emAndamento,
        taxaConclusao: total > 0 ? Math.round((concluidas / total) * 100) : 0,
        progressoMedioPonderado: Math.round(weightedProgress),
      };
    }),
});
