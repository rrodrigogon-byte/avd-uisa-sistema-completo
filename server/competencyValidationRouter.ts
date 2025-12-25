import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  findSimilarCompetencies,
  validateAndSuggestCompetencies,
  createCompetencyIfNotExists,
  interactiveCompetencyValidation,
} from "./competencyValidationService";

/**
 * Router para validação avançada de competências
 */
export const competencyValidationRouter = router({
  /**
   * Buscar competências similares
   */
  findSimilar: protectedProcedure
    .input(
      z.object({
        competencyName: z.string(),
        threshold: z.number().min(0).max(1).optional().default(0.6),
      })
    )
    .query(async ({ input }) => {
      try {
        const suggestions = await findSimilarCompetencies(
          input.competencyName,
          input.threshold
        );
        return {
          success: true,
          competencyName: input.competencyName,
          suggestions,
          hasExactMatch: suggestions.length > 0 && suggestions[0].matchType === 'exact',
          hasSuggestions: suggestions.length > 0,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao buscar competências similares: ${error.message}`,
        });
      }
    }),

  /**
   * Validar múltiplas competências de uma vez
   */
  validateBatch: protectedProcedure
    .input(
      z.object({
        competencyNames: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = await validateAndSuggestCompetencies(input.competencyNames);
        
        const validationResults = Array.from(results.entries()).map(([name, suggestions]) => ({
          original: name,
          suggestions,
          hasExactMatch: suggestions.length > 0 && suggestions[0].matchType === 'exact',
          needsReview: suggestions.length === 0 || (suggestions.length > 0 && suggestions[0].similarity < 0.8),
        }));

        return {
          success: true,
          total: input.competencyNames.length,
          results: validationResults,
          needsReview: validationResults.filter(r => r.needsReview).length,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao validar competências: ${error.message}`,
        });
      }
    }),

  /**
   * Criar nova competência
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await createCompetencyIfNotExists(
          input.name,
          input.description,
          input.category
        );
        return {
          success: true,
          ...result,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao criar competência: ${error.message}`,
        });
      }
    }),

  /**
   * Validação interativa (retorna sugestões ou cria automaticamente)
   */
  interactiveValidation: protectedProcedure
    .input(
      z.object({
        competencyName: z.string(),
        autoCreate: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await interactiveCompetencyValidation(
          input.competencyName,
          input.autoCreate
        );
        return {
          success: true,
          ...result,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro na validação interativa: ${error.message}`,
        });
      }
    }),

  /**
   * Aceitar sugestão de competência
   */
  acceptSuggestion: protectedProcedure
    .input(
      z.object({
        original: z.string(),
        selectedId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        original: input.original,
        selectedId: input.selectedId,
        message: `Competência "${input.original}" mapeada para ID ${input.selectedId}`,
      };
    }),

  /**
   * Rejeitar todas as sugestões e criar nova competência
   */
  rejectAndCreate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await createCompetencyIfNotExists(
          input.name,
          input.description,
          input.category
        );
        return {
          success: true,
          ...result,
          message: result.created 
            ? `Nova competência "${result.name}" criada com sucesso` 
            : `Competência "${result.name}" já existia`,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao criar competência: ${error.message}`,
        });
      }
    }),
});
