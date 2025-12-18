import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  goalTemplateCategories, 
  goalTemplates, 
  goalTemplateUsage 
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const goalTemplatesRouter = router({
  // ============================================================================
  // CATEGORIAS DE TEMPLATES
  // ============================================================================

  /**
   * Listar todas as categorias ativas
   */
  listCategories: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const categories = await db
      .select()
      .from(goalTemplateCategories)
      .where(eq(goalTemplateCategories.active, true))
      .orderBy(goalTemplateCategories.displayOrder, goalTemplateCategories.name);

    return categories;
  }),

  /**
   * Criar nova categoria (admin)
   */
  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [category] = await db.insert(goalTemplateCategories).values(input);

      return { success: true, categoryId: category.insertId };
    }),

  // ============================================================================
  // TEMPLATES DE METAS
  // ============================================================================

  /**
   * Listar templates com filtros
   */
  listTemplates: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        targetType: z.enum(["tecnica", "comportamental", "lideranca", "resultado", "desenvolvimento"]).optional(),
        difficultyLevel: z.enum(["basico", "intermediario", "avancado"]).optional(),
        active: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let query = db.select({
        template: goalTemplates,
        category: goalTemplateCategories,
      })
        .from(goalTemplates)
        .leftJoin(goalTemplateCategories, eq(goalTemplates.categoryId, goalTemplateCategories.id));

      const conditions = [];
      if (input?.active !== undefined) {
        conditions.push(eq(goalTemplates.active, input.active));
      }
      if (input?.categoryId) {
        conditions.push(eq(goalTemplates.categoryId, input.categoryId));
      }
      if (input?.targetType) {
        conditions.push(eq(goalTemplates.targetType, input.targetType));
      }
      if (input?.difficultyLevel) {
        conditions.push(eq(goalTemplates.difficultyLevel, input.difficultyLevel));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(goalTemplates.usageCount));

      return results.map(r => ({
        ...r.template,
        category: r.category,
      }));
    }),

  /**
   * Buscar template por ID
   */
  getTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db
        .select({
          template: goalTemplates,
          category: goalTemplateCategories,
        })
        .from(goalTemplates)
        .leftJoin(goalTemplateCategories, eq(goalTemplates.categoryId, goalTemplateCategories.id))
        .where(eq(goalTemplates.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return {
        ...result.template,
        category: result.category,
      };
    }),

  /**
   * Criar novo template (admin)
   */
  createTemplate: adminProcedure
    .input(
      z.object({
        categoryId: z.number(),
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        targetType: z.enum(["tecnica", "comportamental", "lideranca", "resultado", "desenvolvimento"]),
        metrics: z.any().optional(), // JSON object
        suggestedActions: z.array(z.number()).optional(),
        suggestedDurationMonths: z.number().default(3),
        difficultyLevel: z.enum(["basico", "intermediario", "avancado"]).default("intermediario"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [template] = await db.insert(goalTemplates).values({
        ...input,
        createdBy: ctx.user.id,
      });

      return { success: true, templateId: template.insertId };
    }),

  /**
   * Atualizar template (admin)
   */
  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        targetType: z.enum(["tecnica", "comportamental", "lideranca", "resultado", "desenvolvimento"]).optional(),
        metrics: z.any().optional(),
        suggestedActions: z.array(z.number()).optional(),
        suggestedDurationMonths: z.number().optional(),
        difficultyLevel: z.enum(["basico", "intermediario", "avancado"]).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      await db.update(goalTemplates).set(updates).where(eq(goalTemplates.id, id));

      return { success: true };
    }),

  /**
   * Deletar template (admin)
   */
  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Soft delete - apenas desativa
      await db.update(goalTemplates).set({ active: false }).where(eq(goalTemplates.id, input.id));

      return { success: true };
    }),

  // ============================================================================
  // USO DE TEMPLATES
  // ============================================================================

  /**
   * Registrar uso de template
   */
  useTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        employeeId: z.number(),
        pdiPlanId: z.number().optional(),
        wasCustomized: z.boolean().default(false),
        customizations: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Registrar uso
      const [usage] = await db.insert(goalTemplateUsage).values(input);

      // Incrementar contador de uso do template
      await db
        .update(goalTemplates)
        .set({ usageCount: sql`${goalTemplates.usageCount} + 1` })
        .where(eq(goalTemplates.id, input.templateId));

      return { success: true, usageId: usage.insertId };
    }),

  /**
   * Marcar template como concluído
   */
  completeTemplateUsage: protectedProcedure
    .input(
      z.object({
        usageId: z.number(),
        successfullyCompleted: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(goalTemplateUsage)
        .set({
          completed: true,
          completedAt: new Date(),
          successfullyCompleted: input.successfullyCompleted,
        })
        .where(eq(goalTemplateUsage.id, input.usageId));

      // Atualizar taxa de sucesso do template
      const [template] = await db
        .select()
        .from(goalTemplateUsage)
        .where(eq(goalTemplateUsage.id, input.usageId))
        .limit(1);

      if (template) {
        const [stats] = await db
          .select({
            total: sql<number>`COUNT(*)`,
            successful: sql<number>`SUM(CASE WHEN ${goalTemplateUsage.successfullyCompleted} = 1 THEN 1 ELSE 0 END)`,
          })
          .from(goalTemplateUsage)
          .where(
            and(
              eq(goalTemplateUsage.templateId, template.templateId),
              eq(goalTemplateUsage.completed, true)
            )
          );

        if (stats && stats.total > 0) {
          const successRate = Math.round((stats.successful / stats.total) * 100);
          await db
            .update(goalTemplates)
            .set({ successRate })
            .where(eq(goalTemplates.id, template.templateId));
        }
      }

      return { success: true };
    }),

  /**
   * Estatísticas de templates
   */
  getTemplateStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [stats] = await db
      .select({
        totalTemplates: sql<number>`COUNT(*)`,
        activeTemplates: sql<number>`SUM(CASE WHEN ${goalTemplates.active} = 1 THEN 1 ELSE 0 END)`,
        totalUsage: sql<number>`SUM(${goalTemplates.usageCount})`,
        avgSuccessRate: sql<number>`AVG(${goalTemplates.successRate})`,
      })
      .from(goalTemplates);

    return stats || { totalTemplates: 0, activeTemplates: 0, totalUsage: 0, avgSuccessRate: 0 };
  }),
});
