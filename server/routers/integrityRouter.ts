import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createIntegrityCategory,
  listIntegrityCategories,
  createIntegrityQuestion,
  listIntegrityQuestionsByCategory,
  listAllIntegrityQuestions,
  saveIntegrityResponse,
  getIntegrityResponses,
  analyzeResponsePatterns,
  calculateEthicsIndicators,
  getIntegrityAnalysis,
  checkCrossValidation,
} from "../integrityHelpers";

/**
 * Router para testes de integridade e ética do PIR
 */
export const integrityRouter = router({
  // ============================================================================
  // CATEGORIAS
  // ============================================================================

  /**
   * Cria categoria de teste de integridade
   */
  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        code: z.string().min(2),
        description: z.string().optional(),
        weight: z.number().min(1).default(1),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admins podem criar categorias
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar categorias",
        });
      }

      const category = await createIntegrityCategory(input);

      return {
        success: true,
        category,
        message: "Categoria criada com sucesso",
      };
    }),

  /**
   * Lista categorias ativas
   */
  listCategories: protectedProcedure.query(async () => {
    const categories = await listIntegrityCategories();

    return {
      categories,
      total: categories.length,
    };
  }),

  // ============================================================================
  // QUESTÕES
  // ============================================================================

  /**
   * Cria questão de integridade
   */
  createQuestion: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        questionText: z.string().min(10),
        questionType: z.enum(["likert_scale", "multiple_choice", "true_false", "scenario"]),
        options: z.any().optional(),
        expectedAnswer: z.string().optional(),
        measuresEthics: z.boolean().default(false),
        measuresIntegrity: z.boolean().default(false),
        measuresHonesty: z.boolean().default(false),
        measuresReliability: z.boolean().default(false),
        isCrossValidation: z.boolean().default(false),
        relatedQuestionId: z.number().optional(),
        socialDesirabilityFlag: z.boolean().default(false),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admins podem criar questões
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar questões",
        });
      }

      const question = await createIntegrityQuestion(input);

      return {
        success: true,
        question,
        message: "Questão criada com sucesso",
      };
    }),

  /**
   * Lista questões por categoria
   */
  listQuestionsByCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const questions = await listIntegrityQuestionsByCategory(input.categoryId);

      return {
        questions,
        total: questions.length,
      };
    }),

  /**
   * Lista todas as questões ativas
   */
  listAllQuestions: protectedProcedure.query(async () => {
    const questions = await listAllIntegrityQuestions();

    return {
      questions,
      total: questions.length,
    };
  }),

  // ============================================================================
  // RESPOSTAS E ANÁLISE
  // ============================================================================

  /**
   * Salva resposta de teste de integridade
   */
  saveResponse: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
        questionId: z.number(),
        response: z.string(),
        responseValue: z.number().optional(),
        responseTime: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await saveIntegrityResponse(input);

      return {
        success: true,
        response,
      };
    }),

  /**
   * Salva múltiplas respostas de uma vez
   */
  saveMultipleResponses: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            response: z.string(),
            responseValue: z.number().optional(),
            responseTime: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { pirAssessmentId, responses } = input;

      const savedResponses = await Promise.all(
        responses.map((r) =>
          saveIntegrityResponse({
            pirAssessmentId,
            ...r,
          })
        )
      );

      return {
        success: true,
        savedCount: savedResponses.length,
        responses: savedResponses,
      };
    }),

  /**
   * Obtém respostas de uma avaliação PIR
   */
  getResponses: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const responses = await getIntegrityResponses(input.pirAssessmentId);

      return {
        responses,
        total: responses.length,
      };
    }),

  /**
   * Analisa padrões de respostas
   */
  analyzePatterns: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeResponsePatterns(input.pirAssessmentId);

        return {
          success: true,
          analysis,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao analisar padrões",
        });
      }
    }),

  /**
   * Calcula indicadores de ética
   */
  calculateEthics: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const indicators = await calculateEthicsIndicators(input.pirAssessmentId);

        return {
          success: true,
          indicators,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao calcular indicadores",
        });
      }
    }),

  /**
   * Obtém análise completa de integridade
   */
  getCompleteAnalysis: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const analysis = await getIntegrityAnalysis(input.pirAssessmentId);

      return analysis;
    }),

  /**
   * Verifica respostas cruzadas
   */
  checkCrossValidation: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await checkCrossValidation(input.pirAssessmentId);

      return {
        success: true,
        ...result,
      };
    }),

  /**
   * Processa análise completa do PIR de integridade
   * (análise de padrões + indicadores de ética + validação cruzada)
   */
  processCompleteAnalysis: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. Verifica validação cruzada
        const crossValidation = await checkCrossValidation(input.pirAssessmentId);

        // 2. Analisa padrões de respostas
        const patternAnalysis = await analyzeResponsePatterns(input.pirAssessmentId);

        // 3. Calcula indicadores de ética
        const ethicsIndicators = await calculateEthicsIndicators(input.pirAssessmentId);

        return {
          success: true,
          crossValidation,
          patternAnalysis,
          ethicsIndicators,
          message: "Análise completa processada com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao processar análise",
        });
      }
    }),
});
