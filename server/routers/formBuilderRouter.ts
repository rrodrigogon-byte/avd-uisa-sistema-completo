import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createFormTemplate,
  getAllFormTemplates,
  getFormTemplateById,
  createFormSection,
  getFormSections,
  createFormQuestion,
  getFormQuestions,
  saveFormResponse,
  getFormResponses,
} from "../db";

/**
 * Router para Formul\u00e1rios Din\u00e2micos - Onda 2
 */
export const formBuilderRouter = router({
  /**
   * Templates
   */
  templates: router({
    /**
     * Listar todos os templates
     */
    list: protectedProcedure.query(async () => {
      return await getAllFormTemplates();
    }),

    /**
     * Buscar template por ID
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getFormTemplateById(input.id);
      }),

    /**
     * Criar novo template
     */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Nome \u00e9 obrigat\u00f3rio"),
          description: z.string().optional(),
          category: z.string().optional(),
          type: z.enum(["avaliacao_desempenho", "feedback", "competencias", "metas", "pdi", "outro"]),
          isPublic: z.boolean().default(false),
          allowComments: z.boolean().default(true),
          allowAttachments: z.boolean().default(false),
          requireAllQuestions: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await createFormTemplate({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
  }),

  /**
   * Se\u00e7\u00f5es
   */
  sections: router({
    /**
     * Listar se\u00e7\u00f5es de um template
     */
    list: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        return await getFormSections(input.templateId);
      }),

    /**
     * Criar nova se\u00e7\u00e3o
     */
    create: protectedProcedure
      .input(
        z.object({
          templateId: z.number(),
          title: z.string().min(1, "T\u00edtulo \u00e9 obrigat\u00f3rio"),
          description: z.string().optional(),
          order: z.number(),
          weight: z.number().default(1),
        })
      )
      .mutation(async ({ input }) => {
        return await createFormSection(input);
      }),
  }),

  /**
   * Quest\u00f5es
   */
  questions: router({
    /**
     * Listar quest\u00f5es de uma se\u00e7\u00e3o
     */
    list: protectedProcedure
      .input(z.object({ sectionId: z.number() }))
      .query(async ({ input }) => {
        return await getFormQuestions(input.sectionId);
      }),

    /**
     * Criar nova quest\u00e3o
     */
    create: protectedProcedure
      .input(
        z.object({
          sectionId: z.number(),
          question: z.string().min(1, "Quest\u00e3o \u00e9 obrigat\u00f3ria"),
          description: z.string().optional(),
          type: z.enum([
            "escala",
            "multipla_escolha",
            "texto_curto",
            "texto_longo",
            "matriz",
            "sim_nao",
            "data",
            "numero",
          ]),
          scaleMin: z.number().optional(),
          scaleMax: z.number().optional(),
          scaleMinLabel: z.string().optional(),
          scaleMaxLabel: z.string().optional(),
          options: z.string().optional(), // JSON string
          required: z.boolean().default(true),
          minLength: z.number().optional(),
          maxLength: z.number().optional(),
          weight: z.number().default(1),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return await createFormQuestion(input);
      }),
  }),

  /**
   * Respostas
   */
  responses: router({
    /**
     * Salvar resposta
     */
    save: protectedProcedure
      .input(
        z.object({
          processId: z.number().optional(),
          participantId: z.number().optional(),
          questionId: z.number(),
          responseType: z.enum(["number", "text", "json"]),
          numberValue: z.number().optional(),
          textValue: z.string().optional(),
          jsonValue: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await saveFormResponse({
          ...input,
          evaluatorId: ctx.user.id,
        });
      }),

    /**
     * Buscar respostas de um avaliador
     */
    getByEvaluator: protectedProcedure
      .input(
        z.object({
          processId: z.number(),
          evaluatorId: z.number().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const evaluatorId = input.evaluatorId || ctx.user.id;
        return await getFormResponses(input.processId, evaluatorId);
      }),
  }),

  /**
   * Buscar template completo com se\u00e7\u00f5es e quest\u00f5es
   */
  getFullTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const template = await getFormTemplateById(input.id);
      if (!template) {
        throw new Error("Template n\u00e3o encontrado");
      }

      const sections = await getFormSections(input.id);
      const sectionsWithQuestions = await Promise.all(
        sections.map(async (section) => {
          const questions = await getFormQuestions(section.id);
          return {
            ...section,
            questions,
          };
        })
      );

      return {
        ...template,
        sections: sectionsWithQuestions,
      };
    }),
});
