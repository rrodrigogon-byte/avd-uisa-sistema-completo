import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { defaultApprovers, employees } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Router para gerenciar aprovadores padrão
 * Permite configurar os aprovadores para cada nível do workflow
 */
export const defaultApproversRouter = router({
  /**
   * Listar todos os aprovadores padrão
   */
  list: protectedProcedure
    .input(
      z.object({
        workflowType: z.enum(["job_description", "pdi", "bonus", "evaluation", "all"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(defaultApprovers).orderBy(defaultApprovers.level);

      const conditions = [];
      if (input.workflowType) {
        conditions.push(eq(defaultApprovers.workflowType, input.workflowType));
      }
      if (input.isActive !== undefined) {
        conditions.push(eq(defaultApprovers.isActive, input.isActive));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await query;
    }),

  /**
   * Buscar aprovador padrão por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [approver] = await db
        .select()
        .from(defaultApprovers)
        .where(eq(defaultApprovers.id, input.id))
        .limit(1);

      return approver || null;
    }),

  /**
   * Buscar aprovadores por nível e tipo de workflow
   */
  getByLevelAndType: protectedProcedure
    .input(
      z.object({
        level: z.number().min(1).max(4),
        workflowType: z.enum(["job_description", "pdi", "bonus", "evaluation", "all"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const approvers = await db
        .select()
        .from(defaultApprovers)
        .where(
          and(
            eq(defaultApprovers.level, input.level),
            eq(defaultApprovers.workflowType, input.workflowType),
            eq(defaultApprovers.isActive, true)
          )
        );

      return approvers;
    }),

  /**
   * Criar aprovador padrão
   */
  create: adminProcedure
    .input(
      z.object({
        level: z.number().min(1).max(4),
        levelName: z.string().min(1),
        approverId: z.number(),
        approverName: z.string().min(1),
        approverEmail: z.string().email().optional(),
        approverRole: z.string().optional(),
        workflowType: z.enum(["job_description", "pdi", "bonus", "evaluation", "all"]).default("all"),
        isActive: z.boolean().default(true),
        canSkip: z.boolean().default(false),
        isRequired: z.boolean().default(true),
        notifyOnSubmission: z.boolean().default(true),
        notifyOnApproval: z.boolean().default(true),
        notifyOnRejection: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(defaultApprovers).values({
        ...input,
        createdBy: ctx.user.id,
        createdByName: ctx.user.name || null,
      });

      return {
        id: result.insertId,
        success: true,
      };
    }),

  /**
   * Atualizar aprovador padrão
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        level: z.number().min(1).max(4).optional(),
        levelName: z.string().min(1).optional(),
        approverId: z.number().optional(),
        approverName: z.string().min(1).optional(),
        approverEmail: z.string().email().optional(),
        approverRole: z.string().optional(),
        workflowType: z.enum(["job_description", "pdi", "bonus", "evaluation", "all"]).optional(),
        isActive: z.boolean().optional(),
        canSkip: z.boolean().optional(),
        isRequired: z.boolean().optional(),
        notifyOnSubmission: z.boolean().optional(),
        notifyOnApproval: z.boolean().optional(),
        notifyOnRejection: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(defaultApprovers)
        .set(updateData)
        .where(eq(defaultApprovers.id, id));

      return { success: true };
    }),

  /**
   * Deletar aprovador padrão
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(defaultApprovers).where(eq(defaultApprovers.id, input.id));

      return { success: true };
    }),

  /**
   * Ativar/Desativar aprovador padrão
   */
  toggleActive: adminProcedure
    .input(
      z.object({
        id: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(defaultApprovers)
        .set({ isActive: input.isActive })
        .where(eq(defaultApprovers.id, input.id));

      return { success: true };
    }),

  /**
   * Inicializar aprovadores padrão (UISA)
   * Cria os 4 níveis de aprovação padrão
   */
  initializeDefaultApprovers: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verificar se já existem aprovadores configurados
    const existing = await db.select().from(defaultApprovers).limit(1);
    if (existing.length > 0) {
      return {
        success: false,
        message: "Aprovadores padrão já foram inicializados",
      };
    }

    // Buscar funcionários por nome (você precisará ajustar os IDs conforme seu banco)
    const allEmployees = await db.select().from(employees);

    const alexsandra = allEmployees.find(
      (e) => e.name?.toLowerCase().includes("alexsandra") && e.name?.toLowerCase().includes("oliveira")
    );
    const andre = allEmployees.find((e) => e.name?.toLowerCase().includes("andré"));
    const rodrigo = allEmployees.find(
      (e) => e.name?.toLowerCase().includes("rodrigo") && e.name?.toLowerCase().includes("ribeiro")
    );

    const approversToCreate = [
      {
        level: 2,
        levelName: "RH Cargos e Salários",
        approverId: alexsandra?.id || 0,
        approverName: alexsandra?.name || "Alexsandra Oliveira",
        approverEmail: alexsandra?.email || null,
        approverRole: "Analista de RH - Cargos e Salários",
        workflowType: "all" as const,
        isActive: true,
        canSkip: false,
        isRequired: true,
        notifyOnSubmission: true,
        notifyOnApproval: true,
        notifyOnRejection: true,
        createdBy: ctx.user.id,
        createdByName: ctx.user.name || null,
      },
      {
        level: 3,
        levelName: "Gerente de RH",
        approverId: andre?.id || 0,
        approverName: andre?.name || "André",
        approverEmail: andre?.email || null,
        approverRole: "Gerente de Recursos Humanos",
        workflowType: "all" as const,
        isActive: true,
        canSkip: false,
        isRequired: true,
        notifyOnSubmission: true,
        notifyOnApproval: true,
        notifyOnRejection: true,
        createdBy: ctx.user.id,
        createdByName: ctx.user.name || null,
      },
      {
        level: 4,
        levelName: "Diretor",
        approverId: rodrigo?.id || 0,
        approverName: rodrigo?.name || "Rodrigo Ribeiro Gonçalves",
        approverEmail: rodrigo?.email || null,
        approverRole: "Diretor",
        workflowType: "all" as const,
        isActive: true,
        canSkip: false,
        isRequired: true,
        notifyOnSubmission: true,
        notifyOnApproval: true,
        notifyOnRejection: true,
        createdBy: ctx.user.id,
        createdByName: ctx.user.name || null,
      },
    ];

    for (const approver of approversToCreate) {
      await db.insert(defaultApprovers).values(approver);
    }

    return {
      success: true,
      message: "Aprovadores padrão inicializados com sucesso",
      count: approversToCreate.length,
    };
  }),
});
