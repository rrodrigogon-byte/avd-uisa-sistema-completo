import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  searchCBOApi,
  searchCBOLocal,
  getCBOByCodigo,
  importCBOCargo,
  logCBOSearch,
  getCBOSuggestions,
  getTopCBOCargos,
  updateCBOCache,
} from "../cboHelpers";

/**
 * Router para integração com CBO (Classificação Brasileira de Ocupações)
 */
export const cboRouter = router({
  /**
   * Busca cargos CBO (cache local + API)
   */
  search: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().min(2, "Termo de busca deve ter pelo menos 2 caracteres"),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { searchTerm, limit } = input;

      // Primeiro busca no cache local
      const localResults = await searchCBOLocal(searchTerm, limit);

      // Registra busca no histórico
      await logCBOSearch(ctx.user.id, searchTerm, null, localResults.length);

      return {
        results: localResults,
        source: "cache",
        total: localResults.length,
      };
    }),

  /**
   * Busca cargo específico por código CBO
   */
  getByCodigo: protectedProcedure
    .input(
      z.object({
        codigoCBO: z.string().regex(/^\d{4}-\d{2}$/, "Código CBO inválido (formato: 9999-99)"),
      })
    )
    .query(async ({ input, ctx }) => {
      const cargo = await getCBOByCodigo(input.codigoCBO);

      if (cargo) {
        // Registra uso
        await logCBOSearch(ctx.user.id, input.codigoCBO, cargo.codigoCBO, 1);
      }

      return cargo;
    }),

  /**
   * Importa cargo da API CBO para o cache
   */
  importCargo: protectedProcedure
    .input(
      z.object({
        codigoCBO: z.string().regex(/^\d{4}-\d{2}$/, "Código CBO inválido"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const cargo = await importCBOCargo(input.codigoCBO);

      if (cargo) {
        await logCBOSearch(ctx.user.id, input.codigoCBO, cargo.codigoCBO, 1);
      }

      return {
        success: !!cargo,
        cargo,
      };
    }),

  /**
   * Obtém sugestões de cargos baseadas no histórico do usuário
   */
  getSuggestions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const suggestions = await getCBOSuggestions(ctx.user.id, input.limit);

      return {
        suggestions,
        total: suggestions.length,
      };
    }),

  /**
   * Obtém cargos mais utilizados (cache "quente")
   */
  getTopCargos: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const topCargos = await getTopCBOCargos(input.limit);

      return {
        cargos: topCargos,
        total: topCargos.length,
      };
    }),

  /**
   * Atualiza cache de um cargo específico
   */
  updateCache: protectedProcedure
    .input(
      z.object({
        codigoCBO: z.string().regex(/^\d{4}-\d{2}$/, "Código CBO inválido"),
      })
    )
    .mutation(async ({ input }) => {
      const cargo = await updateCBOCache(input.codigoCBO);

      return {
        success: !!cargo,
        cargo,
        message: cargo
          ? "Cache atualizado com sucesso"
          : "Não foi possível atualizar o cache",
      };
    }),

  /**
   * Busca direta na API CBO (sem cache)
   */
  searchApi: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().min(2),
      })
    )
    .query(async ({ input, ctx }) => {
      const results = await searchCBOApi(input.searchTerm);

      // Registra busca
      await logCBOSearch(ctx.user.id, input.searchTerm, null, results.length);

      return {
        results,
        source: "api",
        total: results.length,
      };
    }),
});
