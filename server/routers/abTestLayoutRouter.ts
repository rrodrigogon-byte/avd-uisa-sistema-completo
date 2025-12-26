import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  createLayoutExperiment,
  getLayoutConfigForEmployee,
  getActiveExperimentForModule,
  recordExperimentCompletion,
  calculateVariantMetrics,
  DEFAULT_LAYOUT_CONFIG,
  VARIANT_B_LAYOUT_CONFIG,
  LayoutConfig,
} from "../services/abTestLayoutService";
import { getDb } from "../db";
import { abTestExperiments, abTestVariants, abTestAssignments } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const abTestLayoutRouter = router({
  /**
   * Criar primeiro experimento A/B para layout de avaliação
   */
  createFirstExperiment: adminProcedure
    .input(z.object({
      targetModule: z.enum(["pir", "competencias", "desempenho", "pdi"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await createLayoutExperiment(
        `Experimento Layout ${input.targetModule.toUpperCase()}`,
        `Teste A/B comparando layout atual vs layout moderno no módulo de ${input.targetModule}`,
        input.targetModule,
        ctx.user.id
      );

      if (!result) {
        throw new Error("Falha ao criar experimento");
      }

      return {
        success: true,
        ...result,
        message: "Experimento criado com sucesso. Ative-o para iniciar o teste.",
      };
    }),

  /**
   * Obter configuração de layout para o funcionário atual
   */
  getMyLayoutConfig: protectedProcedure
    .input(z.object({
      targetModule: z.enum(["pir", "competencias", "desempenho", "pdi"]),
      employeeId: z.number(),
    }))
    .query(async ({ input }) => {
      // Buscar experimento ativo
      const experiment = await getActiveExperimentForModule(input.targetModule);
      
      if (!experiment) {
        return {
          experimentId: null,
          variantId: null,
          config: DEFAULT_LAYOUT_CONFIG,
          isInExperiment: false,
        };
      }

      const config = await getLayoutConfigForEmployee(experiment.id, input.employeeId);

      // Buscar ID da variante atribuída
      const db = await getDb();
      let variantId: number | null = null;
      
      if (db) {
        const [assignment] = await db.select()
          .from(abTestAssignments)
          .where(and(
            eq(abTestAssignments.experimentId, experiment.id),
            eq(abTestAssignments.employeeId, input.employeeId)
          ))
          .limit(1);
        
        variantId = assignment?.variantId || null;
      }

      return {
        experimentId: experiment.id,
        variantId,
        config,
        isInExperiment: true,
      };
    }),

  /**
   * Registrar conclusão do experimento
   */
  recordCompletion: protectedProcedure
    .input(z.object({
      experimentId: z.number(),
      employeeId: z.number(),
      responseTimeSeconds: z.number(),
    }))
    .mutation(async ({ input }) => {
      const success = await recordExperimentCompletion(
        input.experimentId,
        input.employeeId,
        input.responseTimeSeconds
      );

      return { success };
    }),

  /**
   * Obter métricas comparativas do experimento
   */
  getExperimentMetrics: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      return await calculateVariantMetrics(input.experimentId);
    }),

  /**
   * Listar todos os experimentos de layout
   */
  listLayoutExperiments: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const experiments = await db.select()
      .from(abTestExperiments)
      .orderBy(desc(abTestExperiments.createdAt));

    // Enriquecer com métricas
    const enriched = await Promise.all(experiments.map(async (exp) => {
      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, exp.id));

      const assignments = await db.select()
        .from(abTestAssignments)
        .where(eq(abTestAssignments.experimentId, exp.id));

      const totalParticipants = assignments.length;
      const completions = assignments.filter(a => a.completed).length;

      return {
        ...exp,
        variantCount: variants.length,
        totalParticipants,
        completions,
        conversionRate: totalParticipants > 0 
          ? Math.round((completions / totalParticipants) * 100) 
          : 0,
      };
    }));

    return enriched;
  }),

  /**
   * Ativar experimento
   */
  activateExperiment: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Verificar se já existe outro experimento ativo para o mesmo módulo
      const [experiment] = await db.select()
        .from(abTestExperiments)
        .where(eq(abTestExperiments.id, input.experimentId))
        .limit(1);

      if (!experiment) throw new Error("Experimento não encontrado");

      // Pausar outros experimentos ativos do mesmo módulo
      await db.update(abTestExperiments)
        .set({ status: "paused" })
        .where(and(
          eq(abTestExperiments.targetModule, experiment.targetModule),
          eq(abTestExperiments.status, "active")
        ));

      // Ativar este experimento
      await db.update(abTestExperiments)
        .set({ status: "active" })
        .where(eq(abTestExperiments.id, input.experimentId));

      return { success: true };
    }),

  /**
   * Pausar experimento
   */
  pauseExperiment: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      await db.update(abTestExperiments)
        .set({ status: "paused" })
        .where(eq(abTestExperiments.id, input.experimentId));

      return { success: true };
    }),

  /**
   * Finalizar experimento e declarar vencedor
   */
  completeExperiment: adminProcedure
    .input(z.object({ 
      experimentId: z.number(),
      winnerVariantId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      await db.update(abTestExperiments)
        .set({ 
          status: "completed",
          endDate: new Date(),
        })
        .where(eq(abTestExperiments.id, input.experimentId));

      return { success: true };
    }),

  /**
   * Obter configurações de layout disponíveis
   */
  getAvailableLayoutConfigs: protectedProcedure.input(z.object({})).query(() => {
    return {
      default: {
        name: "Layout Padrão",
        description: "Layout atual do sistema",
        config: DEFAULT_LAYOUT_CONFIG,
      },
      modern: {
        name: "Layout Moderno",
        description: "Novo layout com cards expandidos e grade de questões",
        config: VARIANT_B_LAYOUT_CONFIG,
      },
    };
  }),

  /**
   * Obter detalhes de um experimento específico
   */
  getExperimentDetails: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [experiment] = await db.select()
        .from(abTestExperiments)
        .where(eq(abTestExperiments.id, input.experimentId))
        .limit(1);

      if (!experiment) return null;

      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, input.experimentId));

      const metrics = await calculateVariantMetrics(input.experimentId);

      return {
        ...experiment,
        variants,
        metrics,
      };
    }),
});
