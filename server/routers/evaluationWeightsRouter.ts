import { z } from "zod";
import { eq, and, desc, isNull, or, lte, gte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  evaluationWeightConfigs, 
  evaluationWeightHistory,
  departments,
  positions
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const evaluationWeightsRouter = router({
  // Listar configurações de pesos
  list: protectedProcedure
    .input(z.object({
      scope: z.enum(["global", "departamento", "cargo"]).optional(),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
      activeOnly: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input.scope) {
        conditions.push(eq(evaluationWeightConfigs.scope, input.scope));
      }
      
      if (input.departmentId) {
        conditions.push(eq(evaluationWeightConfigs.departmentId, input.departmentId));
      }
      
      if (input.positionId) {
        conditions.push(eq(evaluationWeightConfigs.positionId, input.positionId));
      }
      
      if (input.activeOnly) {
        conditions.push(eq(evaluationWeightConfigs.isActive, true));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const configs = await db
        .select({
          id: evaluationWeightConfigs.id,
          name: evaluationWeightConfigs.name,
          description: evaluationWeightConfigs.description,
          scope: evaluationWeightConfigs.scope,
          departmentId: evaluationWeightConfigs.departmentId,
          positionId: evaluationWeightConfigs.positionId,
          competenciesWeight: evaluationWeightConfigs.competenciesWeight,
          individualGoalsWeight: evaluationWeightConfigs.individualGoalsWeight,
          departmentGoalsWeight: evaluationWeightConfigs.departmentGoalsWeight,
          pirWeight: evaluationWeightConfigs.pirWeight,
          feedbackWeight: evaluationWeightConfigs.feedbackWeight,
          behaviorWeight: evaluationWeightConfigs.behaviorWeight,
          validFrom: evaluationWeightConfigs.validFrom,
          validUntil: evaluationWeightConfigs.validUntil,
          isActive: evaluationWeightConfigs.isActive,
          createdAt: evaluationWeightConfigs.createdAt,
          departmentName: departments.name,
          positionTitle: positions.title,
        })
        .from(evaluationWeightConfigs)
        .leftJoin(departments, eq(evaluationWeightConfigs.departmentId, departments.id))
        .leftJoin(positions, eq(evaluationWeightConfigs.positionId, positions.id))
        .where(whereClause)
        .orderBy(desc(evaluationWeightConfigs.createdAt));

      return configs;
    }),

  // Obter configuração ativa para um contexto específico
  getActive: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date();

      // Prioridade: cargo > departamento > global
      let config = null;

      // Tentar buscar por cargo
      if (input.positionId) {
        const [positionConfig] = await db
          .select()
          .from(evaluationWeightConfigs)
          .where(and(
            eq(evaluationWeightConfigs.scope, "cargo"),
            eq(evaluationWeightConfigs.positionId, input.positionId),
            eq(evaluationWeightConfigs.isActive, true),
            lte(evaluationWeightConfigs.validFrom, now),
            or(
              isNull(evaluationWeightConfigs.validUntil),
              gte(evaluationWeightConfigs.validUntil, now)
            )
          ))
          .limit(1);
        
        if (positionConfig) config = positionConfig;
      }

      // Tentar buscar por departamento
      if (!config && input.departmentId) {
        const [deptConfig] = await db
          .select()
          .from(evaluationWeightConfigs)
          .where(and(
            eq(evaluationWeightConfigs.scope, "departamento"),
            eq(evaluationWeightConfigs.departmentId, input.departmentId),
            eq(evaluationWeightConfigs.isActive, true),
            lte(evaluationWeightConfigs.validFrom, now),
            or(
              isNull(evaluationWeightConfigs.validUntil),
              gte(evaluationWeightConfigs.validUntil, now)
            )
          ))
          .limit(1);
        
        if (deptConfig) config = deptConfig;
      }

      // Buscar configuração global
      if (!config) {
        const [globalConfig] = await db
          .select()
          .from(evaluationWeightConfigs)
          .where(and(
            eq(evaluationWeightConfigs.scope, "global"),
            eq(evaluationWeightConfigs.isActive, true),
            lte(evaluationWeightConfigs.validFrom, now),
            or(
              isNull(evaluationWeightConfigs.validUntil),
              gte(evaluationWeightConfigs.validUntil, now)
            )
          ))
          .limit(1);
        
        config = globalConfig;
      }

      // Retornar configuração padrão se nenhuma encontrada
      if (!config) {
        return {
          id: 0,
          name: "Configuração Padrão",
          scope: "global" as const,
          competenciesWeight: 40,
          individualGoalsWeight: 30,
          departmentGoalsWeight: 15,
          pirWeight: 15,
          feedbackWeight: 0,
          behaviorWeight: 0,
          isDefault: true,
        };
      }

      return { ...config, isDefault: false };
    }),

  // Criar nova configuração de pesos
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      scope: z.enum(["global", "departamento", "cargo"]),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
      competenciesWeight: z.number().min(0).max(100),
      individualGoalsWeight: z.number().min(0).max(100),
      departmentGoalsWeight: z.number().min(0).max(100),
      pirWeight: z.number().min(0).max(100),
      feedbackWeight: z.number().min(0).max(100).default(0),
      behaviorWeight: z.number().min(0).max(100).default(0),
      validFrom: z.string(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validar que a soma dos pesos = 100
      const totalWeight = input.competenciesWeight + input.individualGoalsWeight + 
                         input.departmentGoalsWeight + input.pirWeight + 
                         input.feedbackWeight + input.behaviorWeight;
      
      if (totalWeight !== 100) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `A soma dos pesos deve ser 100%. Atual: ${totalWeight}%` 
        });
      }

      // Validar escopo
      if (input.scope === "departamento" && !input.departmentId) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Departamento é obrigatório para escopo departamental" 
        });
      }
      
      if (input.scope === "cargo" && !input.positionId) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Cargo é obrigatório para escopo de cargo" 
        });
      }

      const [result] = await db.insert(evaluationWeightConfigs).values({
        name: input.name,
        description: input.description,
        scope: input.scope,
        departmentId: input.departmentId,
        positionId: input.positionId,
        competenciesWeight: input.competenciesWeight,
        individualGoalsWeight: input.individualGoalsWeight,
        departmentGoalsWeight: input.departmentGoalsWeight,
        pirWeight: input.pirWeight,
        feedbackWeight: input.feedbackWeight,
        behaviorWeight: input.behaviorWeight,
        validFrom: new Date(input.validFrom),
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        isActive: true,
        createdBy: ctx.user.id,
      });

      return { id: result.insertId, success: true };
    }),

  // Atualizar configuração de pesos
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      competenciesWeight: z.number().min(0).max(100).optional(),
      individualGoalsWeight: z.number().min(0).max(100).optional(),
      departmentGoalsWeight: z.number().min(0).max(100).optional(),
      pirWeight: z.number().min(0).max(100).optional(),
      feedbackWeight: z.number().min(0).max(100).optional(),
      behaviorWeight: z.number().min(0).max(100).optional(),
      validUntil: z.string().optional(),
      isActive: z.boolean().optional(),
      changeReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar configuração atual
      const [current] = await db
        .select()
        .from(evaluationWeightConfigs)
        .where(eq(evaluationWeightConfigs.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Configuração não encontrada" });
      }

      // Calcular novos pesos
      const newWeights = {
        competenciesWeight: input.competenciesWeight ?? current.competenciesWeight,
        individualGoalsWeight: input.individualGoalsWeight ?? current.individualGoalsWeight,
        departmentGoalsWeight: input.departmentGoalsWeight ?? current.departmentGoalsWeight,
        pirWeight: input.pirWeight ?? current.pirWeight,
        feedbackWeight: input.feedbackWeight ?? current.feedbackWeight ?? 0,
        behaviorWeight: input.behaviorWeight ?? current.behaviorWeight ?? 0,
      };

      // Validar soma = 100
      const totalWeight = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
      if (totalWeight !== 100) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `A soma dos pesos deve ser 100%. Atual: ${totalWeight}%` 
        });
      }

      // Registrar histórico se houver mudança nos pesos
      const weightsChanged = 
        newWeights.competenciesWeight !== current.competenciesWeight ||
        newWeights.individualGoalsWeight !== current.individualGoalsWeight ||
        newWeights.departmentGoalsWeight !== current.departmentGoalsWeight ||
        newWeights.pirWeight !== current.pirWeight ||
        newWeights.feedbackWeight !== (current.feedbackWeight ?? 0) ||
        newWeights.behaviorWeight !== (current.behaviorWeight ?? 0);

      if (weightsChanged) {
        await db.insert(evaluationWeightHistory).values({
          configId: input.id,
          previousWeights: {
            competenciesWeight: current.competenciesWeight,
            individualGoalsWeight: current.individualGoalsWeight,
            departmentGoalsWeight: current.departmentGoalsWeight,
            pirWeight: current.pirWeight,
            feedbackWeight: current.feedbackWeight ?? 0,
            behaviorWeight: current.behaviorWeight ?? 0,
          },
          newWeights,
          changeReason: input.changeReason,
          changedBy: ctx.user.id,
        });
      }

      // Atualizar configuração
      const updateData: Record<string, unknown> = { ...newWeights };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.validUntil !== undefined) updateData.validUntil = new Date(input.validUntil);
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db
        .update(evaluationWeightConfigs)
        .set(updateData)
        .where(eq(evaluationWeightConfigs.id, input.id));

      return { success: true };
    }),

  // Obter histórico de alterações
  getHistory: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const history = await db
        .select()
        .from(evaluationWeightHistory)
        .where(eq(evaluationWeightHistory.configId, input.configId))
        .orderBy(desc(evaluationWeightHistory.changedAt));

      return history;
    }),

  // Desativar configuração
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationWeightConfigs)
        .set({ isActive: false })
        .where(eq(evaluationWeightConfigs.id, input.id));

      return { success: true };
    }),

  // Excluir configuração
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Excluir histórico primeiro
      await db.delete(evaluationWeightHistory).where(eq(evaluationWeightHistory.configId, input.id));
      
      // Excluir configuração
      await db.delete(evaluationWeightConfigs).where(eq(evaluationWeightConfigs.id, input.id));

      return { success: true };
    }),
});
