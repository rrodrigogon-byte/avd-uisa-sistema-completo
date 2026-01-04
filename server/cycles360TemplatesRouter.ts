import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { cycle360Templates } from "../drizzle/schema";
import { eq, desc, and, or } from "drizzle-orm";

export const cycles360TemplatesRouter = router({
  /**
   * Listar templates disponíveis (públicos + próprios)
   */
  list: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const templates = await db
      .select()
      .from(cycle360Templates)
      .where(
        or(
          eq(cycle360Templates.isPublic, true),
          eq(cycle360Templates.createdBy, ctx.user.id)
        )
      )
      .orderBy(desc(cycle360Templates.usageCount), desc(cycle360Templates.createdAt));

    return templates.map(t => ({
      ...t,
      competencyIds: JSON.parse(t.competencyIds) as number[],
    }));
  }),

  /**
   * Buscar template por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const template = await db
        .select()
        .from(cycle360Templates)
        .where(eq(cycle360Templates.id, input.id))
        .limit(1);

      if (template.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });
      }

      const t = template[0];

      // Verificar permissão
      if (!t.isPublic && t.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para acessar este template" });
      }

      return {
        ...t,
        competencyIds: JSON.parse(t.competencyIds) as number[],
      };
    }),

  /**
   * Criar novo template
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        description: z.string().optional(),
        selfWeight: z.number().min(0).max(100),
        peerWeight: z.number().min(0).max(100),
        subordinateWeight: z.number().min(0).max(100),
        managerWeight: z.number().min(0).max(100),
        competencyIds: z.array(z.number()),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validar soma dos pesos
      const totalWeight = input.selfWeight + input.peerWeight + input.subordinateWeight + input.managerWeight;
      if (totalWeight !== 100) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `A soma dos pesos deve ser 100%. Atualmente: ${totalWeight}%` 
        });
      }

      const [result] = await db.insert(cycle360Templates).values({
        name: input.name,
        description: input.description || null,
        createdBy: ctx.user.id,
        creatorName: ctx.user.name || null,
        selfWeight: input.selfWeight,
        peerWeight: input.peerWeight,
        subordinateWeight: input.subordinateWeight,
        managerWeight: input.managerWeight,
        competencyIds: JSON.stringify(input.competencyIds),
        isPublic: input.isPublic,
        usageCount: 0,
      });

      return { 
        success: true, 
        templateId: Number(result.insertId) 
      };
    }),

  /**
   * Atualizar template
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        description: z.string().optional(),
        selfWeight: z.number().min(0).max(100).optional(),
        peerWeight: z.number().min(0).max(100).optional(),
        subordinateWeight: z.number().min(0).max(100).optional(),
        managerWeight: z.number().min(0).max(100).optional(),
        competencyIds: z.array(z.number()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se template existe e pertence ao usuário
      const existing = await db
        .select()
        .from(cycle360Templates)
        .where(eq(cycle360Templates.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });
      }

      if (existing[0].createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode editar este template" });
      }

      // Validar soma dos pesos se fornecidos
      if (
        input.selfWeight !== undefined ||
        input.peerWeight !== undefined ||
        input.subordinateWeight !== undefined ||
        input.managerWeight !== undefined
      ) {
        const selfWeight = input.selfWeight ?? existing[0].selfWeight;
        const peerWeight = input.peerWeight ?? existing[0].peerWeight;
        const subordinateWeight = input.subordinateWeight ?? existing[0].subordinateWeight;
        const managerWeight = input.managerWeight ?? existing[0].managerWeight;

        const totalWeight = selfWeight + peerWeight + subordinateWeight + managerWeight;
        if (totalWeight !== 100) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `A soma dos pesos deve ser 100%. Atualmente: ${totalWeight}%` 
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.selfWeight !== undefined) updateData.selfWeight = input.selfWeight;
      if (input.peerWeight !== undefined) updateData.peerWeight = input.peerWeight;
      if (input.subordinateWeight !== undefined) updateData.subordinateWeight = input.subordinateWeight;
      if (input.managerWeight !== undefined) updateData.managerWeight = input.managerWeight;
      if (input.competencyIds !== undefined) updateData.competencyIds = JSON.stringify(input.competencyIds);
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

      await db
        .update(cycle360Templates)
        .set(updateData)
        .where(eq(cycle360Templates.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se template existe e pertence ao usuário
      const existing = await db
        .select()
        .from(cycle360Templates)
        .where(eq(cycle360Templates.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });
      }

      if (existing[0].createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode deletar este template" });
      }

      await db.delete(cycle360Templates).where(eq(cycle360Templates.id, input.id));

      return { success: true };
    }),

  /**
   * Incrementar contador de uso
   */
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const template = await db
        .select()
        .from(cycle360Templates)
        .where(eq(cycle360Templates.id, input.id))
        .limit(1);

      if (template.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });
      }

      await db
        .update(cycle360Templates)
        .set({ usageCount: template[0].usageCount + 1 })
        .where(eq(cycle360Templates.id, input.id));

      return { success: true };
    }),

  /**
   * Obter analytics de templates
   */
  getAnalytics: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const templates = await db.select().from(cycle360Templates);

    // Calcular recomendações baseadas em padrões
    const recommendations: string[] = [];

    const publicTemplates = templates.filter(t => t.isPublic);
    const privateTemplates = templates.filter(t => !t.isPublic);

    if (publicTemplates.length > 0 && privateTemplates.length > publicTemplates.length) {
      recommendations.push(
        "Considere tornar mais templates públicos para aumentar a colaboração entre equipes"
      );
    }

    const avgUsage = templates.length > 0 
      ? templates.reduce((sum, t) => sum + (t.usageCount || 0), 0) / templates.length 
      : 0;
    const underusedTemplates = templates.filter(t => (t.usageCount || 0) < avgUsage * 0.5);

    if (underusedTemplates.length > templates.length * 0.3 && templates.length > 0) {
      recommendations.push(
        "Mais de 30% dos templates estão subutilizados. Considere revisar ou arquivar templates pouco usados"
      );
    }

    const mostUsed = templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];
    if (mostUsed && mostUsed.usageCount && mostUsed.usageCount > avgUsage * 2) {
      recommendations.push(
        `O template "${mostUsed.name}" é muito popular. Considere usá-lo como base para novos templates`
      );
    }

    return {
      recommendations,
      totalTemplates: templates.length,
      publicCount: publicTemplates.length,
      privateCount: privateTemplates.length,
      avgUsage,
    };
  }),
});
