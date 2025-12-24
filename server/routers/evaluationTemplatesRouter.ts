import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { evaluationTemplates, templateQuestions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Router para gerenciar templates de avaliação customizados
 */
export const evaluationTemplatesRouter = router({
  /**
   * Listar todos os templates
   */
  list: protectedProcedure
    .input(
      z.object({
        onlyActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.onlyActive) {
        conditions.push(eq(evaluationTemplates.isActive, true));
      }

      const templates = await db
        .select()
        .from(evaluationTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(evaluationTemplates.createdAt));

      return templates;
    }),

  /**
   * Buscar templates por nível hierárquico (Leadership Pipeline)
   */
  getByHierarchyLevel: protectedProcedure
    .input(
      z.object({
        hierarchyLevel: z.enum(["operacional", "coordenacao", "gerencia", "diretoria"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const templates = await db
        .select()
        .from(evaluationTemplates)
        .where(
          and(
            eq(evaluationTemplates.hierarchyLevel, input.hierarchyLevel),
            eq(evaluationTemplates.isActive, true)
          )
        )
        .orderBy(desc(evaluationTemplates.createdAt));

      // Buscar perguntas para cada template
      const templatesWithQuestions = await Promise.all(
        templates.map(async (template) => {
          const questions = await db
            .select()
            .from(templateQuestions)
            .where(eq(templateQuestions.templateId, template.id))
            .orderBy(templateQuestions.displayOrder);

          return {
            ...template,
            questions,
          };
        })
      );

      return templatesWithQuestions;
    }),

  /**
   * Buscar template por ID com perguntas
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(evaluationTemplates)
        .where(eq(evaluationTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new Error("Template não encontrado");
      }

      const questions = await db
        .select()
        .from(templateQuestions)
        .where(eq(templateQuestions.templateId, input.id))
        .orderBy(templateQuestions.displayOrder);

      return {
        ...template,
        questions,
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
        templateType: z.enum(["360", "180", "90", "custom"]),
        targetRoles: z.array(z.number()).optional(),
        targetDepartments: z.array(z.number()).optional(),
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
        questions: z.array(
          z.object({
            category: z.string(),
            questionText: z.string().min(5, "Pergunta deve ter no mínimo 5 caracteres"),
            questionType: z.enum(["scale_1_5", "scale_1_10", "text", "multiple_choice", "yes_no"]),
            options: z.array(z.string()).optional(),
            weight: z.number().default(1),
            displayOrder: z.number(),
            isRequired: z.boolean().default(true),
            helpText: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Inserir template
      const result = await db.insert(evaluationTemplates).values({
        name: input.name,
        description: input.description,
        templateType: input.templateType,
        targetRoles: input.targetRoles ? JSON.stringify(input.targetRoles) : null,
        targetDepartments: input.targetDepartments ? JSON.stringify(input.targetDepartments) : null,
        isActive: input.isActive,
        isDefault: input.isDefault,
        createdBy: ctx.user.id,
      });

      const templateId = result[0].insertId;

      // Inserir perguntas
      if (input.questions.length > 0) {
        await db.insert(templateQuestions).values(
          input.questions.map((q) => ({
            templateId,
            category: q.category,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ? JSON.stringify(q.options) : null,
            weight: q.weight,
            displayOrder: q.displayOrder,
            isRequired: q.isRequired,
            helpText: q.helpText,
          }))
        );
      }

      return { templateId, success: true };
    }),

  /**
   * Atualizar template existente
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        description: z.string().optional(),
        templateType: z.enum(["360", "180", "90", "custom"]).optional(),
        targetRoles: z.array(z.number()).optional(),
        targetDepartments: z.array(z.number()).optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.templateType !== undefined) updateData.templateType = input.templateType;
      if (input.targetRoles !== undefined) updateData.targetRoles = JSON.stringify(input.targetRoles);
      if (input.targetDepartments !== undefined) updateData.targetDepartments = JSON.stringify(input.targetDepartments);
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

      await db
        .update(evaluationTemplates)
        .set(updateData)
        .where(eq(evaluationTemplates.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Deletar perguntas primeiro
      await db.delete(templateQuestions).where(eq(templateQuestions.templateId, input.id));

      // Deletar template
      await db.delete(evaluationTemplates).where(eq(evaluationTemplates.id, input.id));

      return { success: true };
    }),

  /**
   * Adicionar pergunta a template existente
   */
  addQuestion: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        category: z.string(),
        questionText: z.string().min(5),
        questionType: z.enum(["scale_1_5", "scale_1_10", "text", "multiple_choice", "yes_no"]),
        options: z.array(z.string()).optional(),
        weight: z.number().default(1),
        displayOrder: z.number(),
        isRequired: z.boolean().default(true),
        helpText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(templateQuestions).values({
        templateId: input.templateId,
        category: input.category,
        questionText: input.questionText,
        questionType: input.questionType,
        options: input.options ? JSON.stringify(input.options) : null,
        weight: input.weight,
        displayOrder: input.displayOrder,
        isRequired: input.isRequired,
        helpText: input.helpText,
      });

      return { questionId: result[0].insertId, success: true };
    }),

  /**
   * Atualizar pergunta
   */
  updateQuestion: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        category: z.string().optional(),
        questionText: z.string().min(5).optional(),
        questionType: z.enum(["scale_1_5", "scale_1_10", "text", "multiple_choice", "yes_no"]).optional(),
        options: z.array(z.string()).optional(),
        weight: z.number().optional(),
        displayOrder: z.number().optional(),
        isRequired: z.boolean().optional(),
        helpText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.category !== undefined) updateData.category = input.category;
      if (input.questionText !== undefined) updateData.questionText = input.questionText;
      if (input.questionType !== undefined) updateData.questionType = input.questionType;
      if (input.options !== undefined) updateData.options = JSON.stringify(input.options);
      if (input.weight !== undefined) updateData.weight = input.weight;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
      if (input.isRequired !== undefined) updateData.isRequired = input.isRequired;
      if (input.helpText !== undefined) updateData.helpText = input.helpText;

      await db
        .update(templateQuestions)
        .set(updateData)
        .where(eq(templateQuestions.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar pergunta
   */
  deleteQuestion: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(templateQuestions).where(eq(templateQuestions.id, input.id));

      return { success: true };
    }),

  /**
   * Duplicar template
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar template original
      const [original] = await db
        .select()
        .from(evaluationTemplates)
        .where(eq(evaluationTemplates.id, input.id))
        .limit(1);

      if (!original) {
        throw new Error("Template não encontrado");
      }

      // Buscar perguntas originais
      const originalQuestions = await db
        .select()
        .from(templateQuestions)
        .where(eq(templateQuestions.templateId, input.id))
        .orderBy(templateQuestions.displayOrder);

      // Criar novo template
      const result = await db.insert(evaluationTemplates).values({
        name: `${original.name} (Cópia)`,
        description: original.description,
        templateType: original.templateType,
        targetRoles: original.targetRoles,
        targetDepartments: original.targetDepartments,
        isActive: false, // Cópia inicia como inativa
        isDefault: false,
        createdBy: ctx.user.id,
      });

      const newTemplateId = result[0].insertId;

      // Copiar perguntas
      if (originalQuestions.length > 0) {
        await db.insert(templateQuestions).values(
          originalQuestions.map((q) => ({
            templateId: newTemplateId,
            category: q.category,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            weight: q.weight,
            displayOrder: q.displayOrder,
            isRequired: q.isRequired,
            helpText: q.helpText,
          }))
        );
      }

      return { templateId: newTemplateId, success: true };
    }),

  /**
   * Reordenar perguntas
   */
  reorderQuestions: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        questionIds: z.array(z.number()), // Array de IDs na nova ordem
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Atualizar displayOrder de cada pergunta
      for (let i = 0; i < input.questionIds.length; i++) {
        await db
          .update(templateQuestions)
          .set({ displayOrder: i })
          .where(eq(templateQuestions.id, input.questionIds[i]));
      }

      return { success: true };
    }),

  /**
   * Exportar template como JSON
   */
  exportTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(evaluationTemplates)
        .where(eq(evaluationTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new Error("Template não encontrado");
      }

      const questions = await db
        .select()
        .from(templateQuestions)
        .where(eq(templateQuestions.templateId, input.id))
        .orderBy(templateQuestions.displayOrder);

      // Retornar JSON completo
      return {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        template: {
          name: template.name,
          description: template.description,
          templateType: template.templateType,
          targetRoles: template.targetRoles ? JSON.parse(template.targetRoles as string) : [],
          targetDepartments: template.targetDepartments ? JSON.parse(template.targetDepartments as string) : [],
          questions: questions.map((q) => ({
            category: q.category,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ? JSON.parse(q.options as string) : [],
            weight: q.weight,
            displayOrder: q.displayOrder,
            isRequired: q.isRequired,
            helpText: q.helpText,
          })),
        },
      };
    }),

  /**
   * Importar template de JSON
   */
  importTemplate: protectedProcedure
    .input(
      z.object({
        json: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Parse JSON
      let data;
      try {
        data = JSON.parse(input.json);
      } catch (error) {
        throw new Error("JSON inválido");
      }

      // Validar estrutura
      if (!data.template || !data.template.name || !Array.isArray(data.template.questions)) {
        throw new Error("Estrutura de JSON inválida. Certifique-se de que o arquivo contém 'template.name' e 'template.questions'.");
      }

      const { template } = data;

      // Inserir template
      const result = await db.insert(evaluationTemplates).values({
        name: template.name,
        description: template.description || null,
        templateType: template.templateType || "custom",
        targetRoles: template.targetRoles ? JSON.stringify(template.targetRoles) : null,
        targetDepartments: template.targetDepartments ? JSON.stringify(template.targetDepartments) : null,
        isActive: false, // Importado como inativo por segurança
        isDefault: false,
        createdBy: ctx.user.id,
      });

      const templateId = result[0].insertId;

      // Inserir perguntas
      if (template.questions.length > 0) {
        await db.insert(templateQuestions).values(
          template.questions.map((q: any) => ({
            templateId,
            category: q.category,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ? JSON.stringify(q.options) : null,
            weight: q.weight || 1,
            displayOrder: q.displayOrder,
            isRequired: q.isRequired !== false,
            helpText: q.helpText || null,
          }))
        );
      }

      return { templateId, name: template.name, success: true };
    }),
});
